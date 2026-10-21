import test from 'node:test'
import assert from 'node:assert/strict'
import {tickFrame} from '../src/world-clock.mjs'
import type {FrameContext} from '../src/world-clock.mjs'
function clock(){
 let draws=0,scheduled=0;const failures:unknown[]=[]
 const value:FrameContext={frame:1,closed:false,attached:true,paused:false,lost:false,dirty:true,last:0,pose:{x:0,y:2,z:9,yaw:0,pitch:0},keys:new Set(),
  document:{hidden:false},window:{requestAnimationFrame(){return ++scheduled}},inputBlocked:()=>false,tick:()=>{},draw(){draws++},fail(error){failures.push(error)}}
 return {value,failures,draws:()=>draws,scheduled:()=>scheduled}
}
test('parked views cannot restart frame work and a normal dirty frame renders once',()=>{
 const state=clock();state.value.attached=false;tickFrame(state.value,100);assert.equal(state.draws(),0);assert.equal(state.scheduled(),0)
 state.value.attached=true;tickFrame(state.value,200);assert.equal(state.draws(),1);assert.equal(state.scheduled(),0)
})
test('render faults including falsy failures reach the failure handler without rescheduling active motion',()=>{
 for(const failure of [undefined,false,0,Error('Synthetic render fault')]){
  const state=clock();state.value.keys.add('forward');state.value.draw=()=>{throw failure}
  assert.doesNotThrow(()=>tickFrame(state.value,100));assert.deepEqual(state.failures,[failure]);assert.equal(state.scheduled(),0)
 }
})
