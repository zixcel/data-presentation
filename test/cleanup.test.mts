import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {canonical,type ProjectionRequest} from '@zixcel/projection-contracts'
import {ProjectionRuntime,ProducerRegistry,ExactSourceReader,type SourceAdapter,type SourceReader,type ProjectionStore} from '../src/runtime.mjs'
import {FileProjectionStore} from '../src/store.mjs'

test('ExactSourceReader attempts every owner and preserves even falsy release failures',async()=>{
 for(const failure of [undefined,null,false,0,'']){
  const observed: string[]=[]
  const adapter=(owner: string): SourceAdapter=>({
   acquire:()=>`lease:${owner}`,read:source=>({source,items:[],relations:[],unresolved:[],truncated:false}),
   release(){observed.push(owner);if(owner==='a')throw failure},
   releaseHolder(){observed.push(owner);if(owner==='a')throw failure},
  })
  const reader=new ExactSourceReader(new Map(['c','a','b'].map(owner=>[owner,adapter(owner)])))
  await assert.rejects(reader.release([],'holder:synthetic'),(reason: unknown)=>reason===failure)
  assert.deepEqual(observed,['a','b','c']);observed.length=0
  await assert.rejects(reader.release(['c','b','a'].map(owner=>canonical([owner,`lease:${owner}`])),'holder:synthetic'),(reason: unknown)=>reason===failure)
  assert.deepEqual(observed,['a','b','c'])
 }
})
test('Runtime expiration retains its durable repair on falsy cleanup failure, drains all holders and can retry',async()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'projection-cleanup-'))
 const store=FileProjectionStore.create(path.join(parent,'projection')),registry=new ProducerRegistry()
 const producer=registry.register({id:'synthetic',kind:'data'}),source={owner:'synthetic',ref:'source',revision:'one',kind:'fixture'}
 const request: ProjectionRequest={key:'synthetic',producer,sources:[source],focus:'fixture',purpose:'fixture',visibilityRef:'fixture',limits:{}}
 let broken=true,failure: unknown;const observed: string[]=[]
 const reader: SourceReader={acquireExact:async()=>{throw new Error('unused')},release(_leases,holder){observed.push(holder);if(broken&&holder==='holder:current')throw failure}}
 const runtime=new ProjectionRuntime({store,registry,reader})
 try{
  for(const value of [undefined,null,false,0,'']){
   failure=value;broken=true;observed.length=0
   store.pending({id:'cleanup',holder:'holder:current',previous:[{holder:'holder:previous',leases:[]}],ticket:store.begin(request.key),request,producer,accessRef:'synthetic',expiresAt:Date.now()+10000,attempts:1,failure:null,leases:[]})
   await assert.rejects(runtime.expire('cleanup'),(reason: unknown)=>reason===value)
   assert.deepEqual(observed,['holder:current','holder:previous']);assert.ok(store.repair('cleanup'))
   broken=false;await runtime.expire('cleanup');assert.equal(store.repair('cleanup'),null)
  }
  assert.equal(runtime.inspect().active,0);assert.equal(runtime.inspect().queued,0)
 }finally{await runtime.close();fs.rmSync(parent,{recursive:true,force:true})}
})

test('a synchronously throwing store adapter cannot leak active slots or strand its queued job',async()=>{
 const limits={concurrent:1,queued:1,inputBytes:2097152,executionMs:5000,keys:8,snapshots:2,repairs:16,attempts:3,repairMs:300000}
 const unused=(): never=>{throw new Error('operation must not start')}
 const store: ProjectionStore={inspect:()=>({keys:[],repairs:[],limits}),withAttempt(){throw null},repair:()=>null,read:()=>null,finish:()=>null,begin:unused,publish:unused,pending:unused}
 const registry=new ProducerRegistry(),producer=registry.register({id:'synthetic',kind:'data'})
 const request: ProjectionRequest={key:'synthetic',producer,sources:[{owner:'synthetic',ref:'fixture',revision:'one',kind:'fixture'}],focus:'fixture',purpose:'fixture',visibilityRef:'fixture',limits:{}}
 const reader: SourceReader={acquireExact:unused,release:unused}
 const runtime=new ProjectionRuntime({store,registry,reader,limits})
 try{
  const results=await Promise.allSettled(['first','second'].map(id=>runtime.submit(request,{id,accessRef:'synthetic'})))
  for(const result of results){assert.equal(result.status,'rejected');assert.ok('reason' in result);assert.equal(result.reason,null)}
  assert.equal(runtime.inspect().active,0);assert.equal(runtime.inspect().queued,0)
 }finally{await runtime.close()}
})
