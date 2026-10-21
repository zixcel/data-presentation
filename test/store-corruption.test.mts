import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {FileProjectionStore} from '../src/store.mjs'
import {errorCode} from '../src/common.mjs'
// A valid digest is integrity evidence, never proof of a valid state schema.
function corrupted(change:(state:Record<string,unknown>)=>void):void {
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'projection-corrupt-'))
 try{
  const directory=path.join(parent,'cache'),store=FileProjectionStore.create(directory)
  const filename=path.join(directory,'projection.json')
  const envelope=JSON.parse(fs.readFileSync(filename,'utf8')) as {state:Record<string,unknown>;digest:string}
  change(envelope.state)
  envelope.digest=createHash('sha256').update(JSON.stringify(envelope.state)).digest('hex')
  fs.writeFileSync(filename,JSON.stringify(envelope))
  assert.throws(()=>store.inspect(),error=>['ProjectionStoreCorrupt','InvalidProjection','ProjectionLimitExceeded'].includes(errorCode(error)??''))
  assert.equal(fs.readFileSync(filename,'utf8'),JSON.stringify(envelope),'refusal must not rewrite the corrupt image')
 }finally{fs.rmSync(parent,{recursive:true})}
}
test('incomplete or malformed persisted limits cannot disable retention bounds',()=>{
 corrupted(state=>{state.limits={}})
 corrupted(state=>{state.limits={keys:0}})
})
test('array-like impostors, malformed snapshots and invalid receipts are rejected before use',()=>{
 const key={key:'test',fence:'fence',current:null,snapshots:[],receipts:[]}
 corrupted(state=>{state.keys=[{...key,snapshots:{length:0}}]})
 corrupted(state=>{state.keys=[{...key,receipts:{length:0}}]})
 corrupted(state=>{state.keys=[{...key,snapshots:[{}]}]})
 corrupted(state=>{state.keys=[{...key,receipts:[{key:'other',expected:'old',publication:'new',revision:'revision',jobId:'job'}]}]})
 corrupted(state=>{state.keys=[key,key]})
})

test('parent serialization refuses getters, hooks, cycles and oversize before helper IO',()=>{
 const parent=fs.mkdtempSync(path.join(os.tmpdir(),'projection-admission-'))
 try{
  const directory=path.join(parent,'cache'),store=FileProjectionStore.create(directory)
  const image=fs.readFileSync(path.join(directory,'projection.json'))
  let invoked=0
  const getter=Object.defineProperty({},'value',{enumerable:true,get(){invoked++;return 'unsafe'}})
  const hook={toJSON(){invoked++;return 'unsafe'}}
  const cycle:Record<string,unknown>={};cycle.self=cycle
  for(const value of [getter,hook,cycle,'x'.repeat(2*1024*1024)]){
   assert.throws(()=>Reflect.apply(store.read,store,['test',value]),error=>['InvalidProjection','ProjectionLimitExceeded'].includes(errorCode(error)??''))
  }
  assert.equal(invoked,0)
  assert.deepEqual(fs.readFileSync(path.join(directory,'projection.json')),image)
 }finally{fs.rmSync(parent,{recursive:true})}
})
