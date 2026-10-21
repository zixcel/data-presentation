import {initialPose,cameraMatrix,screenPoint,fitPose,viewCamera} from './world-model.mjs'
import {objectBounds} from './object-presentation.mjs'
import {frameLayout} from './frame-layout.mjs'
import {mapProjection} from './open-world-projection.mjs'
import type {WorldContext} from './world-context.mjs'
export function objectRectWorld(ctx:WorldContext,id:string):{ left: number; right: number; top: number; bottom: number; } | null{
  const item=ctx.model.items.find(item=>item.id===id),width=ctx.host.clientWidth,height=ctx.host.clientHeight
  if(!item||!width||!height)return null
  const [w,h,d]=objectBounds[item.form],matrix=cameraMatrix(ctx.pose,width/height,ctx.zoom),points=[]
  for(const x of [-w/2,w/2])for(const y of [0,h])for(const z of [-d/2,d/2]){
   const point=screenPoint(matrix,item.x+x,item.y+y,item.z+z,width,height)
   if(point?.visible)points.push(point)
  }
  if(!points.length)return null
  return {left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))}
 }
export function publishAnchorWorld(ctx:WorldContext):void{if(ctx.anchorId)ctx.shell?.dispatchEvent(new ctx.window.CustomEvent('world-anchor',{detail:{id:ctx.anchorId,bounds:ctx.objectRect(ctx.anchorId)}}))}
export function syncOrbitWorld(ctx:WorldContext):void{ctx.syncing=true;viewCamera(ctx.pose,Math.max(.1,ctx.host.clientWidth/Math.max(1,ctx.host.clientHeight)),ctx.zoom,ctx.orbitCamera);const focus=ctx.pose.focus??{x:ctx.pose.x,y:ctx.pose.y,z:ctx.pose.z-8};ctx.orbit.target.set(focus.x,focus.y,focus.z);ctx.orbit.update();ctx.syncing=false}
export function overviewWorld(ctx:WorldContext):void{ctx.navigation='overview';ctx.navigationSelect.value=ctx.navigation;ctx.walk.hidden=true;ctx.lastWidth=ctx.host.clientWidth;ctx.lastHeight=ctx.host.clientHeight;ctx.pose=fitPose(ctx.model.items,ctx.lastWidth/Math.max(1,ctx.lastHeight));ctx.needsFit=false;ctx.stopInput();ctx.syncOrbit();ctx.invalidate()}
export function fitViewportWorld(ctx:WorldContext):void{const width=ctx.host.clientWidth,height=ctx.host.clientHeight;if(!width||!height||(ctx.lastWidth===width&&ctx.lastHeight===height))return;ctx.lastWidth=width;ctx.lastHeight=height;if(ctx.navigation==='overview'){ctx.pose=fitPose(ctx.model.items,width/height);ctx.syncOrbit()}ctx.invalidate()}
export function focusObjectWorld(ctx:WorldContext,id:string):void{const item=ctx.model.items.find(i=>i.id===id);if(!item)return;ctx.selectedId=id;ctx.wrap.dataset.selectedId=id
  for(const [ref,node]of ctx.labelNodes)node.dataset.selected=String(ref===id)
  ctx.renderMap();ctx.pose=ctx.navigation==='overview'?fitPose([item],ctx.host.clientWidth/Math.max(1,ctx.host.clientHeight)):{...initialPose(),cameraMode:'third-person',x:item.x,y:item.y+1.85,z:item.z+6,pitch:0};ctx.syncOrbit();ctx.invalidate()}
export function renderMapWorld(ctx:WorldContext):void{
  const projected=mapProjection(ctx.model.items,{selected:ctx.selectedId,marked:ctx.markedId}),items=projected.items
  ctx.mapNote.textContent=projected.omitted?`${items.length} of ${projected.total} objects shown. Narrow this view to see the rest.`:`${items.length} objects in this view`
  ctx.mapButton.disabled=!ctx.selectedId||!ctx.model.items.some(item=>item.id===ctx.selectedId);ctx.mapButton.textContent=ctx.selectedId===ctx.markedId?'Clear marker':'Mark selected'
  ctx.mapList.replaceChildren();if(!items.length)return
  const xs=items.map(item=>item.x),zs=items.map(item=>item.z),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs)
  for(const item of items){const node=ctx.make('button','world-map-point',(item.title??item.id).slice(0,1).toUpperCase());node.type='button';node.title=item.title??item.id;node.dataset.mapId=item.id;node.dataset.selected=String(item.selected);node.dataset.marked=String(item.marked)
   node.setAttribute('aria-label','Find '+item.title+' on map');node.style.left=(10+80*(item.x-minX)/Math.max(1,maxX-minX))+'%';node.style.top=(10+80*(item.z-minZ)/Math.max(1,maxZ-minZ))+'%';ctx.mapList.append(node)}
 }
export function positionBubbleWorld(ctx:WorldContext):void{
  if(!ctx.conversationId)return
  if(!ctx.model.items.some(item=>item.id===ctx.conversationId)){ctx.closeConversation();return}
  const {panel}=frameLayout(ctx.host.clientWidth,ctx.host.clientHeight,'actions',ctx.objectRect(ctx.conversationId))
  Object.assign(ctx.bubble.style,{left:panel.x+'px',top:panel.y+'px',width:panel.width+'px',height:panel.height+'px',maxHeight:panel.height+'px'})
 }
