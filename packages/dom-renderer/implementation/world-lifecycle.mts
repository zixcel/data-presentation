import {copyPose} from './world-api.mjs'
import type {Camera} from '@zixcel/projection-client'
import type {WorldOptions,WorldSnapshot} from './world-api.mjs'
import {disposeWorldResources} from './world-resources.mjs'
import {initialPose,movePose,clamp} from './world-model.mjs'
import {spatialPattern} from './spatial-patterns.mjs'
import {keyDirection} from './world-input.mjs'
import type {WorldContext} from './world-context.mjs'
export function onKeyWorld(ctx:WorldContext,event:KeyboardEvent):void{
  if(event.target!==ctx.canvas||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return
  if(event.type==='keydown'&&event.code==='KeyM'){event.preventDefault();ctx.map.open=!ctx.map.open;return}
  if(event.type==='keydown'&&event.code==='KeyQ'){event.preventDefault();const target=ctx.hovered??ctx.selectedId;if(target){ctx.selectedId=target;ctx.mapButton.click()}return}
  if(ctx.navigation==='overview'){if(event.type==='keydown'&&event.code==='KeyE')ctx.activate(ctx.hovered);return}
  const key=keyDirection(event.code)
  if(key){event.preventDefault();if(event.type==='keydown'&&!ctx.inputBlocked())ctx.keys.add(key);else ctx.keys.delete(key);ctx.invalidate()}
  else if(event.type==='keydown'&&!event.repeat){if(event.code==='KeyE'){event.preventDefault();ctx.activate(ctx.hovered)}if(event.code==='Escape'){ctx.stopInput();ctx.canvas.blur()}}
 }
export function snapshotWorld(ctx:WorldContext):WorldSnapshot{return {...copyPose(ctx.pose),target:ctx.target,presentation:{...ctx.view},navigation:ctx.navigation,populated:ctx.fittedPopulation}}
export function parkWorld(ctx:WorldContext):void{ctx.attached=false;ctx.paused=true;ctx.stopInput();ctx.stopFrame();ctx.orbit.enabled=false;ctx.resize.disconnect();ctx.wrap.remove()}
export function mountWorld(ctx:WorldContext,nextHost:HTMLElement,options:WorldOptions):void{
  if(ctx.closed)throw Error('WorldDisposed')
  const nextTarget=options.target??null
  spatialPattern(options.objects??[],options.relations??[],ctx.target!==nextTarget?(ctx.poses.get(nextTarget)?.presentation??{pattern:options.pattern??'ground'}):ctx.view)
  const changedTarget=ctx.target!==(options.target??null)
  const changedContext=ctx.context!==(options.context??null);ctx.context=options.context??null
  if(changedTarget){ctx.poses.set(ctx.target,ctx.snapshot());while(ctx.poses.size>8)ctx.poses.delete(ctx.poses.keys().next().value!)}
  ctx.host=nextHost;ctx.attached=true;ctx.host.prepend(ctx.wrap);ctx.resize.disconnect();ctx.resize.observe(ctx.host)
  ctx.onActivate=options.onActivate??(()=>{});ctx.conversation=options.conversation??null;ctx.workActivity=options.activity??null;ctx.target=options.target??null;ctx.wrap.dataset.target=ctx.target??'';ctx.paused=false
  ctx.engine.panel.hidden=options.pattern==='garden'
  if(ctx.conversationId)ctx.closeConversation()
  if(changedTarget){const saved=ctx.poses.get(ctx.target);ctx.view=saved?.presentation??{pattern:options.pattern??'ground',groupBy:'declared',group:null,page:0};ctx.navigation=saved?.navigation??'overview';ctx.pose=saved?copyPose(saved):initialPose();ctx.fittedPopulation=Boolean(saved?.populated);ctx.needsFit=!saved;ctx.sourceObjects=[];ctx.recent.clear();ctx.query.value='';ctx.updates.open=false;ctx.nearby.open=false;ctx.map.open=false;ctx.selectedId=null;ctx.markedId=null;ctx.wrap.dataset.selectedId='';ctx.wrap.dataset.markedId='';ctx.model={items:[],relations:[]}}
  else if(changedContext){ctx.view={...ctx.view,group:null,page:0};ctx.sourceObjects=[];ctx.recent.clear();ctx.query.value='';ctx.updates.open=false}
  ctx.navigationSelect.value=ctx.navigation;ctx.walk.hidden=ctx.navigation!=='explore';ctx.update(options.objects??[],options.relations);ctx.syncOrbit();ctx.invalidate()
 }
export function closeWorld(ctx:WorldContext):void{
 if(ctx.closed)return;ctx.closed=true;ctx.attached=false
 const previousGpu=ctx.gpu;ctx.gpu=null;ctx.geometry=null;ctx.objects=[];ctx.relations=[];ctx.sourceObjects=[];ctx.sourceRelations=[];ctx.actorRanges=[];ctx.projected=[];ctx.projection=null;ctx.model={items:[],relations:[]};ctx.restored=null
 try{disposeWorldResources(ctx,previousGpu)}finally{ctx.workActivity=null;ctx.conversation=null;ctx.onActivate=()=>{};ctx.activityPresentation={}}
}
export function activityWorld(ctx:WorldContext,value:unknown):void{if(ctx.closed)throw Error('WorldDisposed');ctx.workActivity=value??null;ctx.update(ctx.sourceObjects,ctx.sourceRelations)}
export function applyWorld(ctx:WorldContext,value:Camera):void{const next=clamp(value.z,.65,1.5);if(next!==ctx.zoom){ctx.zoom=next;ctx.syncOrbit();ctx.invalidate()}}
export function changeWorld(ctx:WorldContext,action:string):void{
  ctx.fitViewport()
  if(action==='reset'){ctx.overview();return}
  if(ctx.navigation==='overview'){ctx.syncOrbit();if(action==='in')ctx.orbit.dollyIn(1/1.2);else if(action==='out')ctx.orbit.dollyOut(1/1.2);else ctx.orbit.pan(action==='left'?40:action==='right'?-40:0,action==='up'?40:action==='down'?-40:0);ctx.orbit.update();return}
  else if(['in','out','up','down','left','right'].includes(action)){const forward=['in','up'].includes(action)?1:['out','down'].includes(action)?-1:0,side=action==='left'?-1:action==='right'?1:0;for(let i=0;i<5;i++)ctx.pose=movePose(ctx.pose,forward,side,.05)}
  ctx.invalidate()
 }
export function pauseWorld(ctx:WorldContext,value:boolean):void{ctx.paused=value;if(value){ctx.stopInput();ctx.stopFrame()}else ctx.invalidate()}
