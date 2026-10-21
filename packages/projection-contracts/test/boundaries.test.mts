import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,readdirSync} from 'node:fs'
import {canonical} from '../src/index.mjs'
import {frozen} from '../src/client.mjs'
import {sha256 as nodeHash} from '../src/hash-node.mjs'
import {sha256 as browserHash} from '../src/hash-browser.mjs'
import type {ProjectionRequest,ExactSource,SceneConfiguration,DataProjection,SceneProjection} from '../src/index.mjs'
import {produce,scene} from '../src/index.mjs'
import {fixture} from './fixture.mts'
import {rebuild} from './wire-inputs.mts'

test('ordinary Data and Scene retain pre-migration canonical bytes and revision identities',()=>{
 const expected=JSON.parse(readFileSync(new URL('./deterministic-wire.json',import.meta.url),'utf8')) as {
  input:{request:ProjectionRequest;sources:ExactSource[];config:SceneConfiguration};data:DataProjection;scene:SceneProjection}
 const data=produce(expected.input.request,expected.input.sources),view=scene(data,expected.input.config)
 assert.equal(canonical(data),canonical(expected.data));assert.equal(data.revision,expected.data.revision)
 assert.equal(canonical(view),canonical(expected.scene));assert.equal(view.revision,expected.scene.revision)
})
test('Node and browser hash branches agree for UTF-8 canonical wire values',()=>{
 for(const value of ['','ASCII','シーラカンス 😀',canonical({source:['one','two'],value:42})])assert.equal(nodeHash(value),browserHash(value))
})
test('array index accessors and custom serializers are refused without executing code',()=>{
 let invoked=0
 const accessor=['value'];Object.defineProperty(accessor,'0',{get(){invoked++;return 'value'},enumerable:true})
 assert.throws(()=>canonical(accessor),{code:'InvalidProjection'})
 const serializer=Object.assign(['value'],{toJSON(){invoked++;return []}})
 assert.throws(()=>canonical(serializer),{code:'InvalidProjection'})
 const method=Object.assign(['value'],{map(){invoked++;return []}})
 assert.throws(()=>canonical(method),{code:'InvalidProjection'})
 assert.equal(invoked,0)
})
test('sparse, subclassed and non-enumerable array items cannot enter canonical JSON',()=>{
 class Derived extends Array<string>{}
 assert.throws(()=>canonical(new Derived('one')),{code:'InvalidProjection'})
 assert.throws(()=>canonical(Array(1)),{code:'InvalidProjection'})
 const hidden=['one'];Object.defineProperty(hidden,'0',{value:'one',enumerable:false})
 assert.throws(()=>canonical(hidden),{code:'InvalidProjection'})
})
test('serialization budgets cannot be disabled by non-finite, zero or excessive maxima',()=>{
 for(const maximum of [NaN,Infinity,0,-1,2097153])assert.throws(()=>canonical({},maximum),{code:'ProjectionLimitExceeded'})
 assert.throws(()=>canonical('x'.repeat(4096),100),{code:'ProjectionLimitExceeded'})
 const cycle: Record<string,unknown>={};cycle.self=cycle
 assert.throws(()=>canonical(cycle),{code:'ProjectionLimitExceeded'})
})
test('freezing is cycle-safe, refuses deep/large graphs and never invokes an accessor',()=>{
 const cycle: Record<string,unknown>={};cycle.self=cycle
 assert.equal(frozen(cycle),cycle);assert.ok(Object.isFrozen(cycle))
 let deep: unknown={};for(let i=0;i<25;i++)deep={nested:deep}
 assert.throws(()=>frozen(deep),{code:'ProjectionLimitExceeded'})
 assert.throws(()=>frozen(Array(33000).fill(0)),{code:'ProjectionLimitExceeded'})
 let invoked=0
 assert.throws(()=>frozen({get nested(){invoked++;return {}}}),{code:'InvalidProjection'})
 assert.equal(invoked,0);assert.ok(Object.isFrozen(frozen({camera:{x:.5,y:-.5,z:1.2}}).camera))
})
test('typed helper modules do not create runtime files outside the artifact fingerprint',()=>{
 const files=readdirSync(new URL('../src/',import.meta.url)).filter(name=>name.endsWith('.mjs')).sort()
 assert.deepEqual(files,['client','contract','hash-browser','hash-node','index','producer','publication'].map(name=>name+'.mjs'))
})

test('synchronous rebuild refuses thenables without invoking accessors and drains native rejection',async()=>{
 const input=fixture();let invoked=0
 const value={get then(){invoked++;return ()=>{invoked++}}}
 assert.throws(()=>rebuild(input.request,()=>value),{code:'ProjectionRebuildUnavailable'})
 assert.equal(invoked,0)
 assert.throws(()=>rebuild(input.request,()=>({then(){invoked++}})),{code:'ProjectionRebuildUnavailable'})
 assert.equal(invoked,0)
 const rejected=Promise.reject(new Error('synthetic source rejection'))
 assert.throws(()=>rebuild(input.request,()=>rejected),{code:'ProjectionRebuildUnavailable'})
 await new Promise(resolve=>setImmediate(resolve))
})
