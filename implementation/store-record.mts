import {canonical,produce} from '@zixcel/projection-contracts'
import type {ProjectionRequest} from '@zixcel/projection-contracts'
import type {RepairRecord} from './types/runtime.mjs'
import {check,shape,token} from './common.mjs'
export function record(value:unknown):RepairRecord {
 shape(value,['id','holder','previous','ticket','request','producer','accessRef','expiresAt','attempts','failure','leases'])
 canonical(value,65536);token(value.id);token(value.holder);token(value.accessRef)
 shape(value.ticket,['key','expected']);token(value.ticket.key);token(value.ticket.expected)
 check(value.request!==null&&typeof value.request==='object'&&'key' in value.request&&'sources' in value.request)
 check(value.request.key===value.ticket.key&&typeof value.expiresAt==='number'&&Number.isSafeInteger(value.expiresAt)&&value.expiresAt>0)
 check(typeof value.attempts==='number'&&Number.isSafeInteger(value.attempts)&&value.attempts>=0)
 check(value.failure===null||typeof value.failure==='string')
 check(Array.isArray(value.request.sources)&&value.request.sources.length<=8&&Array.isArray(value.leases)&&value.leases.length<=8,'ProjectionLimitExceeded')
 // produce validates the complete closed request and each exact source before use.
 const request=value.request as ProjectionRequest
 produce(request,request.sources.map(source=>({source,items:[],relations:[],unresolved:[],truncated:false})))
 check(canonical(value.producer)===canonical(request.producer))
 for(const ref of request.sources)shape(ref,['owner','ref','revision','kind'])
 for(const ref of value.leases)token(ref)
 check(Array.isArray(value.previous)&&value.previous.length<=2,'ProjectionLimitExceeded')
 const holders:string[]=[]
 for(const old of value.previous){
  shape(old,['holder','leases']);const holder=token(old.holder)
  check(holder!==value.holder&&Array.isArray(old.leases)&&old.leases.length<=8)
  old.leases.forEach(token);holders.push(holder)
 }
 check(new Set(holders).size===holders.length)
 return value as unknown as RepairRecord
}
