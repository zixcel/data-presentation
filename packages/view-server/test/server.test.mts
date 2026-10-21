import test from 'node:test'
import assert from 'node:assert/strict'
import net from 'node:net'
import {createHash,randomUUID} from 'node:crypto'
import type {DeliveryFailure,DeliveryOutcome} from '../src/index.mjs'
import {createDeliveryServer} from '../src/index.mjs'
import {freePort,invoke,script,jsonResponse} from './server-fixture.mts'
import {setTimeout as delay} from 'node:timers/promises'
test('actual HTTP initial envelope, CSP, session command fencing, bounded intake, readiness and cleanup',async()=>{
 const port=await freePort()
 const origin=`http://localhost:${port}`,assets=[{path:'/assets/client.js',bytes:script,bytesLength:script.length,kind:'script' as const,digest:createHash('sha256').update(script).digest('hex')}]
 let writes=0,closed=false
 const server=createDeliveryServer({policy:{owner:"fixture/delivery",title:"Fixture",contract:"zixcel/view-delivery/1",allowedOwners:["fixture/control"]},origin,assets,readinessToken:'test-readiness',site:{
  async document(url,{assets}){return {envelope:{contract:'zixcel/view-delivery/1',site:{id:'site:fixture',revision:'a'.repeat(64)},initial:null,snapshot:null,assets,transport:{path:'/api/projection-live',classes:['STATE']},
   readiness:{state:'SetupRequired',requirements:[{ref:'owner:test',owner:'test',state:'SetupRequired',setup:null,failure:{owner:'test',operation:'read',code:'Missing',requirementRef:'owner:test',detail:null}}]}},bootstrap:{label:'</script><script>alert(1)</script>'}}},
  read:async()=>({state:'SetupRequired'}),command:async()=>({writes:++writes}),live:async()=>({kind:'RecoveryUnavailable'}),close:async()=>{closed=true}}})
 await server.listen()
 try{
  const doc=await fetch(origin),html=await doc.text(),cookie=doc.headers.get('set-cookie')!.split(';')[0]
  assert.equal(doc.status,200);assert(!doc.headers.get('content-security-policy')!.includes('unsafe-inline'))
  assert(!html.includes('<script>alert'));assert(html.includes('\\u003c/script'))
  const initial=JSON.parse(html.match(/<script id="delivery-state" type="application\/json">(.*?)<\/script>/s)![1]) as {envelope:{readiness:{state:string}};bootstrap:{csrf:string}};assert.equal(initial.envelope.readiness.state,'SetupRequired')
  assert.equal(writes,0);assert.equal((await fetch(origin+'/api/ready',{headers:{'x-delivery-readiness':'test-readiness'}})).status,204)
  const request={method:'POST',headers:{cookie,origin,'content-type':'application/json','x-delivery-csrf':initial.bootstrap.csrf,'x-delivery-request-nonce':randomUUID()},body:'{}'}
  assert.deepEqual(await jsonResponse(await fetch(origin+'/api/action',request)),{writes:1})
  const replay=await fetch(origin+'/api/action',request)
  assert.equal(replay.status,400);assert.equal(writes,1)
  const rejected=await jsonResponse(replay)
  assert.equal(rejected.error.code,'crowsi-browser-security-request-replayed')
  assert.equal(rejected.error.ownerFailure.owner,'crowsi/browser-security')
  assert.equal(rejected.error.ownerFailure.outcomeStage,'DELIVERY_REJECTED')
  assert.equal(rejected.error.ownerFailure.uncertain,false)
  assert.equal((await fetch(origin+'/api/action',{...request,headers:{...request.headers,origin:'http://evil.test','x-delivery-request-nonce':randomUUID()}})).status,400)
  const large=await fetch(origin+'/api/action',{...request,headers:{...request.headers,'x-delivery-request-nonce':randomUUID()},body:JSON.stringify({value:'x'.repeat(32768)})})
  assert.equal(large.status,400);assert.equal((await jsonResponse(large)).error.code,'DeliveryLimitExceeded');assert.equal(writes,1)
  for(const rejected of [{'content-encoding':'gzip'},{'content-type':'text/plain'}] as Record<string,string>[]){
   const response=await fetch(origin+'/api/action',{...request,headers:{...request.headers,...rejected,'x-delivery-request-nonce':randomUUID()}})
   assert.equal(response.status,400);assert.equal((await jsonResponse(response)).error.code,'InvalidInput')
  }
  // Exercise pre-allocation framing admission through raw HTTP. Missing or
  // noncanonical length is rejected by delivery; contradictory/invalid framing
  // may be rejected even earlier by Node's HTTP parser. Neither reaches owner.
  for(const framing of ['', 'Content-Length: 0\r\n', 'Content-Length: 01\r\n', 'Transfer-Encoding: chunked\r\n', 'Content-Length: 32769\r\n']){
   const response=await new Promise<string>((resolve,reject)=>{
    const socket=net.connect(port,'127.0.0.1');let response=''
    socket.setTimeout(2000,()=>socket.destroy(Error('framing timeout')));socket.on('error',reject)
    socket.on('data',bytes=>{response+=bytes;if(response.includes('\r\n\r\n')){socket.destroy();resolve(response)}})
    socket.on('connect',()=>socket.write(`POST /api/action HTTP/1.1\r\nHost: localhost:${port}\r\nOrigin: ${origin}\r\nCookie: ${cookie}\r\nX-Delivery-Csrf: ${initial.bootstrap.csrf}\r\nX-Delivery-Request-Nonce: ${randomUUID()}\r\nContent-Type: application/json\r\n${framing}Connection: close\r\n\r\n`))
   });assert.match(response,/^HTTP\/1\.1 400 /)
  }
  assert.equal(writes,1)
  const status=await fetch(origin+'/api/status',{headers:{cookie}});assert.deepEqual(await jsonResponse(status),{state:'SetupRequired'});assert.equal(writes,1)
  assert.equal(await(await fetch(origin+'/assets/client.js')).text(),script.toString())
 }finally{await server.close()}
 assert(closed);assert.equal(server.inspect().alive,false);assert.equal(server.inspect().activeRequests,0);assert.equal(server.inspect().transport.connections,0)
})
