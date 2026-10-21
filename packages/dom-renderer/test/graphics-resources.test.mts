import test from 'node:test'
import assert from 'node:assert/strict'
import {disposeGraphics} from '../src/graphics-disposal.mjs'
import {admitGeometry} from '../src/geometry-policy.mjs'
import {worldLimits} from '../src/world-model.mjs'
test('every graphics resource is released and falsy failures remain observable',()=>{
 for(const failure of [undefined,null,false,0,'',Error('controlled disposal failure')]){
  const order:number[]=[]
  assert.throws(()=>disposeGraphics([()=>{order.push(1);throw failure},()=>{order.push(2)},()=>{order.push(3);throw failure},()=>{order.push(4)}]),
   error=>error instanceof AggregateError&&error.errors.length===2&&error.errors.every(e=>e===failure))
  assert.deepEqual(order,[1,2,3,4])
 }
 let releases=0;disposeGraphics([()=>{releases++},()=>{releases++}]);assert.equal(releases,2)
})
test('malformed and nonfinite geometry cannot reach the GPU upload',()=>{
 const valid=new Float32Array(18)
 admitGeometry(valid,[{id:'actor',start:0,end:2}])
 for(const data of [new Float32Array(8),new Float32Array([NaN,...Array.from({length:8},()=>0)]),new Float32Array([Infinity,...Array.from({length:8},()=>0)]),new Float32Array(worldLimits.instances*9)])
  assert.throws(()=>admitGeometry(data,[]),/WorldGeometryLimitExceeded/)
 for(const ranges of [[{id:'actor',start:-1,end:1}],[{id:'actor',start:0,end:3}],[{id:'actor',start:.5,end:1}],[{id:'actor',start:1,end:1}],
  [{id:'actor',start:0,end:1},{id:'actor',start:1,end:2}],Array.from({length:513},(_,i)=>({id:String(i),start:0,end:1}))])
  assert.throws(()=>admitGeometry(valid,ranges),/WorldGeometryLimitExceeded/)
 assert.deepEqual([...valid],Array.from({length:18},()=>0),'admission never mutates caller data')
})
