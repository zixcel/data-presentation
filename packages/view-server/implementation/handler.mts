import {timingSafeEqual} from 'node:crypto'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {assessRequestBoundary} from '@crowsi/browser-security/boundary'
import {bounds,validateDelivery} from '@zixcel/view-delivery-contracts'
import type {DeliveryServerOptions,Observation} from './types.mjs'
import type {Prepared} from './prepare.mjs'
import {body,headers,header,record,sessionId,safeDocument,send,fail} from './wire.mjs'
export function createHandler(options:DeliveryServerOptions,prepared:Prepared){
 const {origin,site,readinessToken}=options,{ownerPolicy,boundary,authority,assetMap}=prepared
 const authorize=(request:IncomingMessage)=>{
  const reason=assessRequestBoundary(boundary,{method:request.method??'',host:header(request,'host'),origin:header(request,'origin')||undefined,fetchSite:header(request,'sec-fetch-site')||undefined})
  if(reason)fail(reason)
 }
 const authenticate=(request:IncomingMessage)=>{const id=sessionId(request,ownerPolicy.cookieName);authority.authenticate(id);return id}
 const connection=(request:IncomingMessage,response:ServerResponse)=>{
  let current
  try{const id=authenticate(request);current={sessionId:id,...authority.authenticate(id)}}catch{current=authority.issue()}
  response.setHeader('set-cookie',`${ownerPolicy.cookieName}=${current.sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${boundary.protocol==='https:'?'; Secure':''}`)
  return {csrf:current.csrfToken,expiresAtUnixMs:current.expiresAt}
 }
 async function handle(request:IncomingMessage,response:ServerResponse,signal:AbortSignal,observation:Observation):Promise<void>{
  for(const [key,value]of Object.entries(headers))response.setHeader(key,value)
  authorize(request)
  if(typeof request.url!=='string'||request.url.length>4096)fail('InvalidInput')
  const url=new URL(request.url,origin),pathname=url.pathname
  if(request.method==='GET'&&pathname==='/api/ready'){
   const provided=Buffer.from(String(request.headers[ownerPolicy.readinessHeader]??'')),expected=Buffer.from(readinessToken??'')
   if(!expected.length||provided.length!==expected.length||!timingSafeEqual(provided,expected))return send(response,404,{error:{code:'NotFound'}})
   observation.stage='NOT_DISPATCHED';response.writeHead(204);response.end();return // liveness only, never ProductReady
  }
  if(request.method==='GET'&&assetMap.has(pathname)){
   observation.stage='NOT_DISPATCHED'
   const asset=assetMap.get(pathname)!;response.writeHead(200,{'content-type':asset.descriptor.kind==='script'?'text/javascript; charset=utf-8':'text/css; charset=utf-8','content-length':asset.content.length});response.end(asset.content);return
  }
  if(request.method==='POST'&&pathname==='/api/connection'){
   const value=await body(request,signal);if(!value||Array.isArray(value)||Object.keys(value).length)fail('InvalidInput')
   observation.stage='NOT_DISPATCHED';send(response,200,connection(request,response));return
  }
  if(request.method==='GET'&&!pathname.startsWith('/api/')){
   observation.stage='NOT_DISPATCHED'
   const csrf=connection(request,response)
   if(!site.document)fail('SourceUnavailable')
   const {envelope,bootstrap}=await site.document(url,{signal,assets:[...assetMap.values()].map(a=>a.descriptor)})
   validateDelivery(envelope,ownerPolicy.contract)
   if(JSON.stringify(envelope.assets)!==JSON.stringify([...assetMap.values()].map(a=>a.descriptor)))fail('InvalidAsset')
   const document=safeDocument(envelope,{...bootstrap,...csrf},ownerPolicy.title)
   if(document.length>bounds.documentBytes)fail('DeliveryLimitExceeded')
   response.writeHead(200,{'content-type':'text/html; charset=utf-8','content-length':document.length});response.end(document);return
  }
  authenticate(request)
  if(request.method==='GET'){if(!site.read)fail('SourceUnavailable');observation.stage='NOT_DISPATCHED';send(response,200,await site.read(url,{signal}));return}
  if(request.method!=='POST')return send(response,405,{error:{code:'MethodNotAllowed'}})
  authority.authorizeMutation(sessionId(request,ownerPolicy.cookieName),header(request,ownerPolicy.csrfHeader),header(request,ownerPolicy.nonceHeader))
  const value=await body(request,signal)
  observation.stage='OUTCOME_UNCERTAIN'
  // The site was entered, not proof of physical dispatch or canonical commit.
  // Only exact owner evidence may refine this transient observation.
  const observe=(input:unknown)=>{
   const value=record(input)
   // Trusted site supplies evidence only. Ignore malformed observations; never
   // change execution branching, mint identity, or persist a competing receipt.
   if(typeof value.stage!=='string'||!['NOT_DISPATCHED','OWNER_REJECTED','OUTCOME_UNCERTAIN','OWNER_COMMITTED','PUBLICATION_FAILED_AFTER_COMMIT'].includes(value.stage))return
   if(typeof value.owner!=='string'||!ownerPolicy.allowedOwners.includes(value.owner))return
   if(typeof value.operation!=='string'||!/^[a-z][a-z0-9]*(?:\/[a-z][a-zA-Z0-9]*)+$/.test(value.operation))return
   if(value.receiptRef!==undefined&&value.receiptRef!==null&&(typeof value.receiptRef!=='string'||!/^[a-f0-9]{64}$/.test(value.receiptRef)))return
   if(['OWNER_COMMITTED','PUBLICATION_FAILED_AFTER_COMMIT'].includes(value.stage)&&!value.receiptRef)return
   if(observation.receiptRef&&value.receiptRef!==observation.receiptRef)return
   if(value.managementRequestRef!==undefined&&value.managementRequestRef!==null&&(typeof value.managementRequestRef!=='number'||!Number.isSafeInteger(value.managementRequestRef)||value.managementRequestRef<1))return
   Object.assign(observation,{stage:value.stage,owner:value.owner,operation:value.operation,receiptRef:value.receiptRef??null})
   if(value.managementRequestRef!==undefined)observation.managementRequestRef=value.managementRequestRef as number|null
  }
  if(!site.command)fail('SourceUnavailable')
  const result=await site.command(url,value,{signal,observe,requestRef:observation.requestRef})
  const receipt=record(record(result).canonical).receiptRef
  if(typeof receipt==='string'&&/^[a-f0-9]{64}$/.test(receipt)){
   observation.receiptRef=receipt;observation.stage=record(record(result).projection).state==='FailedTyped'?'PUBLICATION_FAILED_AFTER_COMMIT':'OWNER_COMMITTED'
  }
  if(!response.writableEnded&&!response.destroyed)send(response,200,result)
 }
 return {authorize,authenticate,handle}
}
