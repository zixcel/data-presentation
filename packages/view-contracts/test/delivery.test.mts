import test from 'node:test'
import assert from 'node:assert/strict'
import {readiness,validateDelivery,validateSubmission,bounds} from '../src/index.mjs'
const ready={ref:'owner:semantic',owner:'sem-lang',state:'Ready' as const,failure:null,setup:null}
const missing={ref:'owner:execution',owner:'hatter/execution',state:'SetupRequired' as const,failure:{owner:'hatter/execution',operation:'inspect',code:'OwnerMissing',requirementRef:'owner:execution',detail:null},setup:{id:'setup:execution',owner:'hatter',operation:'source/execute'}}
test('dependency-specific readiness; missing optional owner never blocks Subject or loses failure',()=>{
 assert.deepEqual(readiness(['owner:semantic'],[ready,missing]),{state:'Ready' as const,requirements:[ready]})
 assert.deepEqual(readiness(['owner:execution'],[ready,missing]),{state:'SetupRequired' as const,requirements:[missing]})
 assert.throws(()=>readiness(['owner:unknown'],[ready,missing]))
 assert.throws(()=>readiness(['owner:execution'],[ready,{...missing,failure:null}]))
 assert.throws(()=>readiness(['owner:execution'],[ready,{...missing,failure:{...missing.failure,requirementRef:'other'}}]))
})
test('bounded initial document forbids executable site extensions and bogus snapshot identity',()=>{
 const value={contract:'zixcel/view-delivery/1',site:{id:'site:console',revision:'a'.repeat(64)},initial:null,snapshot:null,
  readiness:readiness(['owner:semantic'],[ready]),assets:[{path:'/assets/client.js',digest:'b'.repeat(64),bytes:100,kind:'script'}],transport:{path:'/api/projection-live',classes:['STATE']}}
 assert.deepEqual(validateDelivery(value),value)
 for(const patch of [{html:'<script/>'},{snapshot:{}},{initial:{key:'x',revision:'x',lineage:{}}},{assets:[{path:'https://untrusted.test/a.js',digest:'b'.repeat(64),bytes:100,kind:'script'}]},
  {transport:{path:'/other-socket',classes:['STATE']}},{assets:Array(bounds.assets+1).fill(value.assets[0])}])assert.throws(()=>validateDelivery({...value,...patch}))
})

test('submission rejects accessor execution and malformed scalar identity before use',()=>{
 const input={projectionKey:'projection:test',projectionRevision:'a'.repeat(64),sceneId:'scene:test',actionId:'action:test',interactionRef:'interaction:test',generation:'1',inputContractRef:'input:test',values:{enabled:true}}
 assert.equal(validateSubmission(input),input)
 for(const patch of [{actionId:3},{values:{value:NaN}},{values:null}])assert.throws(()=>validateSubmission({...input,...patch}))
 let invoked=0
 Object.defineProperty(input,'actionId',{enumerable:true,get(){invoked++;throw new Error('must not execute')}})
 assert.throws(()=>validateSubmission(input));assert.equal(invoked,0)
})
