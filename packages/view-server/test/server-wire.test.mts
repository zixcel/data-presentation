import test from 'node:test'
import assert from 'node:assert/strict'
import {encode} from '../src/wire.mjs'
test('response admission refuses sparse/oversized arrays and serialization hooks before encoding',()=>{
 let called=0
 for(const value of [new Array(4097),Object.assign([],{extra:true}),Object.defineProperty({},'toJSON',{value(){called++;return 'unexpected'}}),Object.create({toJSON(){called++}})])
  assert.throws(()=>encode(value),/InvalidDeliveryData|DeliveryLimitExceeded/)
 assert.equal(called,0)
 const accessor=Object.defineProperty({},'value',{enumerable:true,get(){called++;return 'unexpected'}})
 assert.throws(()=>encode(accessor),/InvalidDeliveryData/);assert.equal(called,0)
 assert.equal(encode({items:[null,true,1,'value']}).toString(),'{"items":[null,true,1,"value"]}')
})
