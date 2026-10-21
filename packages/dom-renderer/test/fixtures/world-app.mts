import type {} from './world-fixture-types.d.mts'
import {createWorld} from '../../src/world-runtime.mjs'
import {createWorldSurface} from '../../src/world-surface.mjs'
import {record} from '../../src/world-api.mjs'
window.makeWorld=createWorld
window.makeSurface=(adapter={})=>createWorldSurface({...adapter,describeRole:(activity,id)=>{
 const value=record(activity)
 if(!value.available)return {state:'Unavailable',label:'Source unavailable'}
 const roles=Array.isArray(value.roles)?value.roles:[]
 return roles.some(role=>record(record(role).roleRef).id===id&&record(role).state==='Running')?{state:'AwaitingResult',label:'Awaiting result'}:{state:'Idle',label:'No active request'}
}})
window.activations=[]
window.objects=[{id:'role:guide',title:'Guide',kind:'character'},{id:'role:reviewer',title:'Reviewer',kind:'character'},{id:'claim:1',title:'Language',kind:'record'},{id:'role:offline',title:'Offline',kind:'character',disabled:true}]
window.openWorld=()=>{
 const host=document.getElementById('stage');if(!host)throw Error('Synthetic stage missing')
 return window.world=createWorld(host,{objects:window.objects,onActivate:id=>window.activations.push(id),conversation:(item,activate)=>{
  if(item.kind!=='character')return null
  const body=document.createElement('section'),text=document.createElement('p'),button=document.createElement('button')
  text.textContent='Published state for '+item.id;button.textContent='Review role';button.onclick=activate;body.append(text,button);return body
 }})
}
window.openWorld()
