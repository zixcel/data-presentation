import type {Camera} from '@zixcel/projection-client'
import type {WorldObject,WorldRelation} from './world-types.mjs'
import type {WorldSnapshot,WorldSurface,WorldOptions} from './world-api.mjs'
export interface SpatialPresentation {items?:Map<string,Partial<WorldObject>>;surface?:WorldSurface;activity?:unknown;target?:string|null;pattern?:string;context?:string|null}
import {createWorld} from './world-runtime.mjs'
// Installed RenderPlan/role controls remain the only operation authority.
export function spatialView(viewport:HTMLElement,board:HTMLElement,camera:Camera,relations:readonly WorldRelation[],signal:AbortSignal,pose:WorldSnapshot|null,conversation:WorldOptions['conversation']=null,presentation:SpatialPresentation={}){
 if(signal.aborted)throw Error('WorldViewCancelled')
 const declaredRelations=[...relations]
 const nodes=()=>[...board.querySelectorAll<HTMLElement>('[data-item-id],[data-world-object]')]
 const declarations=():WorldObject[]=>nodes().filter(node=>!node.hidden).map(node=>({
  id:node.dataset.itemId??node.dataset.worldObject??'',
  ...presentation.items?.get(node.dataset.itemId??''),
  kind:node.hasAttribute('data-world-object')?'character':'record',
  title:node.querySelector('strong,[data-kind=select]')?.textContent??'Information',
  summary:node.querySelector('[data-item-summary]')?.textContent?.slice(0,80)??'',
  observationLabel:node.dataset.observationLabel??'',
  disabled:node instanceof viewport.ownerDocument.defaultView!.HTMLButtonElement&&node.disabled===true,selected:node.dataset.selected==='true'
 }))
 const options={objects:declarations(),relations:declaredRelations,pose,conversation,activity:presentation.activity,target:presentation.target,pattern:presentation.pattern,context:presentation.context,onActivate:(id:string)=>{
  const node=nodes().find(node=>(node.dataset.itemId??node.dataset.worldObject)===id)
  if(!node||node.hidden||node instanceof viewport.ownerDocument.defaultView!.HTMLButtonElement&&node.disabled)return
  ;(node.hasAttribute('data-world-object')?node:node.querySelector<HTMLElement>('[data-kind=inspect]'))?.click()
 }}
 const lease=presentation.surface?.attach(viewport,options),world=lease?.world??createWorld(viewport,options)
 board.hidden=true;world.apply(camera)
 const observer=new viewport.ownerDocument.defaultView!.MutationObserver(()=>world.update(declarations(),declaredRelations))
 observer.observe(board,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden','data-selected','disabled']})
 let closed=false
 const close=()=>{if(closed)return;closed=true;observer.disconnect();try{if(lease)lease.release();else world.close()}finally{board.hidden=false}}
 signal.addEventListener('abort',close,{once:true})
 return {change:world.change,apply:world.apply,snapshot:world.snapshot,pause:world.pause,activity:world.activity,close}
}
