import fs from 'node:fs'
import path from 'node:path'
import {validateSnapshot} from '@zixcel/projection-contracts'
import {bounds,check,hash,shape,token} from './common.mjs'
import {privateFile,removeStaleTemporary} from './private-files.mjs'
import {record} from './store-record.mjs'
import type {StoreImage} from './store-model.mjs'
export const MAX=12*1024*1024
function readBounded(file:string,max:number):Buffer {
 const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW)
 try{
  const stat=fs.fstatSync(fd);privateFile(stat);check(stat.size<=max,'ProjectionStoreCorrupt')
  const bytes=Buffer.alloc(max+1),n=fs.readSync(fd,bytes,0,max+1,0)
  check(n<=max,'ProjectionLimitExceeded');return bytes.subarray(0,n)
 }finally{fs.closeSync(fd)}
}
export function decodeImage(value:unknown):StoreImage {
 shape(value,['format','instance','limits','keys','repairs'])
 check(value.format==='projection-runtime/0.10.0','ProjectionStoreCorrupt');token(value.instance)
 const limits=bounds(value.limits)
 shape(value.limits,Object.keys(limits))
 check(Array.isArray(value.keys)&&value.keys.length<=limits.keys&&Array.isArray(value.repairs)&&value.repairs.length<=limits.repairs,'ProjectionStoreCorrupt')
 const keys:string[]=[],ids:string[]=[]
 for(const k of value.keys){
  shape(k,['key','fence','current','snapshots','receipts']);keys.push(token(k.key));token(k.fence)
  check(k.current===null||typeof k.current==='string','ProjectionStoreCorrupt')
  check(Array.isArray(k.snapshots)&&k.snapshots.length<=limits.snapshots&&Array.isArray(k.receipts)&&k.receipts.length<=limits.snapshots,'ProjectionStoreCorrupt')
  for(const value of k.snapshots){const snapshot=validateSnapshot(value);check(snapshot.key===k.key,'ProjectionStoreCorrupt')}
  const revisions=k.snapshots.map((snapshot: {revision:string})=>snapshot.revision)
  check(new Set(revisions).size===revisions.length,'ProjectionStoreCorrupt')
  const jobs:string[]=[]
  for(const receipt of k.receipts){
   shape(receipt,['key','expected','publication','revision','jobId'])
   check(receipt.key===k.key,'ProjectionStoreCorrupt')
   for(const field of ['expected','publication','revision'])token(receipt[field])
   jobs.push(token(receipt.jobId))
  }
  check(new Set(jobs).size===jobs.length,'ProjectionStoreCorrupt')
 }
 for(const repair of value.repairs)ids.push(record(repair).id)
 check(new Set(keys).size===keys.length&&new Set(ids).size===ids.length,'ProjectionStoreCorrupt')
 return value as unknown as StoreImage
}
export function load(directory:string):StoreImage {
 const envelope:unknown=JSON.parse(readBounded(path.join(directory,'projection.json'),MAX).toString())
 shape(envelope,['digest','state']);check(hash(JSON.stringify(envelope.state))===envelope.digest,'ProjectionStoreCorrupt')
 return decodeImage(envelope.state)
}
export function save(directory:string,state:StoreImage):void {
 const bytes=JSON.stringify({digest:hash(JSON.stringify(state)),state})
 check(Buffer.byteLength(bytes)<=MAX,'ProjectionLimitExceeded')
 const temporary=path.join(directory,'projection.next');removeStaleTemporary(temporary)
 const fd=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600)
 try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
 fs.renameSync(temporary,path.join(directory,'projection.json'))
 const dir=fs.openSync(directory,'r');try{fs.fsyncSync(dir)}finally{fs.closeSync(dir)}
}
