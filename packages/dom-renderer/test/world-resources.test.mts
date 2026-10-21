import test from 'node:test'
import assert from 'node:assert/strict'
import {copyPose} from '../src/world-api.mjs'
import {disposeWorldResources} from '../src/world-resources.mjs'
test('partial view initialization releases all acquired resources despite independent failures',()=>{
 const order:string[]=[],failure=Error('synthetic cleanup failure')
 const release=(name:string,broken=false)=>()=>{order.push(name);if(broken)throw failure}
 assert.throws(()=>disposeWorldResources({stopInput:release('input',true),stopFrame:release('frames'),resize:{disconnect:release('resize')},controller:{abort:release('events')},engine:{close:release('owner view')},orbit:{dispose:release('orbit',true)},gpu:{close:release('gpu')},
  labelNodes:{clear:release('labels')},directoryNodes:{clear:release('directory')},recent:{clear:release('recent')},poses:{clear:release('poses')},wrap:{remove:release('wrapper')}}),
  error=>error instanceof AggregateError&&error.errors.length===2&&error.errors.every(e=>e===failure))
 assert.deepEqual(order,['input','frames','resize','events','owner view','orbit','gpu','labels','directory','recent','poses','wrapper'])
 assert.doesNotThrow(()=>disposeWorldResources({}))
})

test('camera snapshots copy only finite presentation fields and do not retain arbitrary metadata',()=>{
 const input={x:1,y:2,z:3,yaw:0,pitch:0,focus:{x:4,y:5,z:6},privateMetadata:'not a pose field',toJSON(){throw Error('Serialization hook must not run')}}
 const copied=copyPose(input);assert.deepEqual(copied,{x:1,y:2,z:3,yaw:0,pitch:0,focus:{x:4,y:5,z:6}})
 input.focus.x=100;assert.equal(copied.focus?.x,4)
 assert.throws(()=>copyPose({...input,x:Infinity}),/WorldPoseInvalid/)
})
