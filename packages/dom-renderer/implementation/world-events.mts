import {eventDetail} from './world-api.mjs'
import {movePose,lookPose,clamp,pickWorld} from './world-model.mjs'
import {keyDirection} from './world-input.mjs'
import type {WorldContext} from './world-context.mjs'
export function bindWorldEvents(ctx:WorldContext){
ctx.hint.addEventListener('click',()=>{ctx.nearby.open=true},{signal:ctx.signal})
ctx.shell?.addEventListener('world-anchor-request',event=>{const detail=eventDetail(event);if(detail.id===null||typeof detail.id==='string'){ctx.anchorId=detail.id;ctx.publishAnchor()}},{signal:ctx.signal})
ctx.query.addEventListener('input',ctx.filterDirectory,{signal:ctx.signal})
ctx.host.closest('.delivery-shell')?.addEventListener('frame-panel-open',()=>{ctx.nearby.open=false;ctx.map.open=false;ctx.updates.open=false;ctx.closeConversation()},{signal:ctx.signal})
ctx.nearby.addEventListener('toggle',()=>{ctx.map.hidden=ctx.nearby.open;if(ctx.nearby.open){ctx.map.open=false;ctx.updates.open=false;ctx.closeConversation()}},{signal:ctx.signal})
ctx.updates.addEventListener('toggle',()=>{if(ctx.updates.open){ctx.nearby.open=false;ctx.closeConversation()}},{signal:ctx.signal})
ctx.map.addEventListener('toggle',()=>{if(ctx.map.open){ctx.nearby.open=false;ctx.updates.open=false;ctx.closeConversation();ctx.stopInput()}},{signal:ctx.signal})
ctx.orbit.addEventListener('change',()=>{if(ctx.syncing)return;ctx.pose={x:ctx.orbitCamera.position.x,y:ctx.orbitCamera.position.y,z:ctx.orbitCamera.position.z,yaw:-ctx.orbitCamera.rotation.y,pitch:ctx.orbitCamera.rotation.x,focus:{x:ctx.orbit.target.x,y:ctx.orbit.target.y,z:ctx.orbit.target.z}};ctx.needsFit=false;ctx.invalidate()})
ctx.mapList.addEventListener('click',event=>{const id=(event.target instanceof ctx.window.Element?event.target.closest<HTMLElement>('[data-map-id]'):null)?.dataset.mapId;if(id)ctx.focusObject(id)},{signal:ctx.signal})
ctx.mapButton.addEventListener('click',()=>{if(!ctx.selectedId)return;ctx.markedId=ctx.markedId===ctx.selectedId?null:ctx.selectedId;ctx.wrap.dataset.markedId=ctx.markedId??'';for(const [id,node]of ctx.labelNodes)node.dataset.marked=String(id===ctx.markedId);ctx.renderMap()},{signal:ctx.signal})
ctx.canvas.addEventListener('pointerdown',ctx.enableOrbit,{signal:ctx.signal,capture:true});
ctx.canvas.addEventListener('wheel',ctx.enableOrbit,{signal:ctx.signal,capture:true})
ctx.updateList.addEventListener('click',event=>{
  const id=(event.target instanceof ctx.window.Element?event.target.closest<HTMLElement>('[data-change-id]'):null)?.dataset.changeId;if(!id)return
  if(ctx.view.pattern==='garden'&&!ctx.model.items.some(item=>item.id===id)){ctx.updates.open=false;ctx.onActivate(id);return}
  const group=ctx.projection?.groups.find(group=>group.memberIds.includes(id))
  if(group){ctx.view={...ctx.view,group:group.id,page:0};ctx.update(ctx.sourceObjects,ctx.sourceRelations)
   const index=(ctx.view.pattern==='garden'?group.memberIds:[...ctx.sourceObjects.filter(i=>i.kind==='character').map(i=>i.id),...group.memberIds]).indexOf(id)
   if(index>=24){ctx.view={...ctx.view,page:Math.floor(index/24)};ctx.update(ctx.sourceObjects,ctx.sourceRelations)}
  }
  ctx.updates.open=false;ctx.focusObject(id)
 },{signal:ctx.signal})
ctx.labels.addEventListener('click',event=>ctx.activate((event.target instanceof ctx.window.Element?event.target.closest<HTMLElement>('[data-world-id]'):null)?.dataset.worldId),{signal:ctx.signal})
ctx.list.addEventListener('click',event=>{
  const control=(event.target instanceof ctx.window.Element?event.target.closest('button'):null),id=control?.closest<HTMLElement>('[data-directory-id]')?.dataset.directoryId
  if(!id||!control)return
  if(control.dataset.focus==='true'){ctx.focusObject(id);ctx.nearby.open=false;ctx.canvas.focus({preventScroll:true})}else ctx.activate(id)
 },{signal:ctx.signal})
ctx.canvas.addEventListener('keydown',ctx.onKey,{signal:ctx.signal});
ctx.window.addEventListener('keyup',event=>{const key=keyDirection(event.code);if(key){ctx.keys.delete(key);ctx.invalidate()}},{signal:ctx.signal})
ctx.bubble.addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();ctx.closeConversation()}},{signal:ctx.signal})
ctx.canvas.addEventListener('pointerdown',event=>{if(!event.isPrimary){ctx.drag=null;return}if(event.button!==0||ctx.inputBlocked())return;ctx.canvas.focus({preventScroll:true});ctx.drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};ctx.canvas.setPointerCapture(event.pointerId)},{signal:ctx.signal})
ctx.canvas.addEventListener('pointermove',event=>{if(!ctx.drag||ctx.drag.id!==event.pointerId)return;if(ctx.navigation==='explore')ctx.pose=lookPose(ctx.pose,event.clientX-ctx.drag.x,event.clientY-ctx.drag.y);ctx.drag.x=event.clientX;ctx.drag.y=event.clientY;ctx.invalidate()},{signal:ctx.signal})
ctx.canvas.addEventListener('pointerup',event=>{if(!ctx.drag||ctx.drag.id!==event.pointerId)return;const clicked=Math.hypot(event.clientX-ctx.drag.startX,event.clientY-ctx.drag.startY)<5;ctx.drag=null;if(clicked){const r=ctx.canvas.getBoundingClientRect();ctx.activate(pickWorld(ctx.model.items,ctx.pose,event.clientX-r.left,event.clientY-r.top,r.width,r.height,ctx.zoom))}},{signal:ctx.signal,capture:true})
for(const type of ['pointercancel','lostpointercapture'])ctx.canvas.addEventListener(type,()=>ctx.drag=null,{signal:ctx.signal})
ctx.canvas.addEventListener('wheel',event=>{if(ctx.navigation==='overview'||event.ctrlKey||event.metaKey||ctx.inputBlocked()||!Number.isFinite(event.deltaY))return;event.preventDefault();const amount=clamp(-event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?ctx.host.clientHeight:1)/100,-2,2);ctx.pose={...ctx.pose,x:clamp(ctx.pose.x+Math.sin(ctx.pose.yaw)*amount,-28,28),z:clamp(ctx.pose.z-Math.cos(ctx.pose.yaw)*amount,-350,28)};ctx.invalidate()},{signal:ctx.signal,passive:false})
for(const [direction,icon]of [['forward','↑'],['left','←'],['back','↓'],['right','→'],['rise','⇧'],['descend','⇩']]){
  const b=ctx.button(icon,'Walk '+direction,()=>{},ctx.walk)
  b.addEventListener('pointerdown',event=>{if(event.button||ctx.inputBlocked())return;event.preventDefault();b.setPointerCapture(event.pointerId);ctx.keys.add(direction);ctx.invalidate()},{signal:ctx.signal})
  for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>{ctx.keys.delete(direction);ctx.invalidate()},{signal:ctx.signal})
  b.addEventListener('click',event=>{if(event.detail===0&&!ctx.inputBlocked()){ctx.pose=movePose(ctx.pose,direction==='forward'?1:direction==='back'?-1:0,direction==='right'?1:direction==='left'?-1:0,.05,direction==='rise'?1:direction==='descend'?-1:0);ctx.invalidate()}},{signal:ctx.signal})
 }
ctx.nearby.addEventListener('toggle',()=>{if(ctx.nearby.open)ctx.stopInput()},{signal:ctx.signal})
ctx.window.addEventListener('blur',()=>{ctx.wrap.dataset.motionPaused='true';ctx.stopInput();ctx.stopFrame()},{signal:ctx.signal});
ctx.window.addEventListener('focus',()=>{ctx.wrap.dataset.motionPaused='false';ctx.invalidate()},{signal:ctx.signal})
ctx.document.addEventListener('visibilitychange',()=>{ctx.wrap.dataset.motionPaused=String(ctx.document.hidden);ctx.stopInput();if(ctx.document.hidden)ctx.stopFrame();else ctx.invalidate()},{signal:ctx.signal})
ctx.window.addEventListener('pagehide',()=>{ctx.paused=true;ctx.stopInput();ctx.stopFrame()},{signal:ctx.signal})
ctx.window.addEventListener('pageshow',()=>{ctx.paused=false;ctx.invalidate()},{signal:ctx.signal})
ctx.canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ctx.lost=true;ctx.gpu?.close();ctx.gpu=null;ctx.fail(Error('WorldGraphicsContextLost'))},{signal:ctx.signal})
ctx.canvas.addEventListener('webglcontextrestored',ctx.initialize,{signal:ctx.signal})
}
