import {canonical,copy,frozen,shape,text} from '@zixcel/projection-contracts/client'
import { renderPlan } from './render-plan.mjs'
export {renderPlan}
import {check,empty,sceneSnapshot,targets,rebase,projectionIdentity} from './state.mjs'
export {projectionIdentity}
import type {SceneProjection} from '@zixcel/projection-contracts/client'
import type {PresentationState,PresentationChange,AdoptionContext,ActionHandle} from './types.mjs'
export type * from './types.mjs'


export class ClientProjectionRuntime {
  #cache=new Map<string,SceneProjection[]>();#presentation: PresentationState=frozen(empty());#closed=false
  get projection(){return this.#cache.get(this.#presentation.activeScene??'')?.at(-1)??null}
  get presentation(){return this.#presentation}
  #open(){check(!this.#closed,'ClientRuntimeClosed')}
  current(key: string){this.#open();return this.#cache.get(key)?.at(-1)??null}
  adopt(snapshot: unknown,context: AdoptionContext){
    this.#open();shape(context,['kind'],['expected','expectedCurrent'])
    const next=sceneSnapshot(snapshot),old=this.current(next.key)
    if(context.kind==='hydrate'){
      check(canonical(projectionIdentity(next))===canonical(context.expected),'HydrationProjectionMismatch')
      check(!old||old.revision===next.revision,'HydrationProjectionMismatch')
    }else{
      check(context.kind==='current'&&Object.hasOwn(context,'expectedCurrent'),'ProjectionAdoptionError')
      check((old?.revision??null)===context.expectedCurrent,'StaleProjectionDelivery')
    }
    if(!old&&this.#cache.size===8){
      const evict=[...this.#cache.keys()].find(k=>k!==this.#presentation.activeScene)
      check(evict!==undefined,'SceneUnavailable');this.#cache.delete(evict)
    }
    const versions=this.#cache.get(next.key)??[]
    const retained=versions.filter(v=>v.revision!==next.revision).slice(-1)
    this.#cache.delete(next.key);this.#cache.set(next.key,[...retained,next])
    if(this.#presentation.activeScene===next.key)this.#presentation=rebase(this.#presentation,next)
    else if(this.#presentation.activeScene===null)this.navigate(next.key)
    return next
  }
  input(value: unknown,context: {expectedCurrent: string|null}): SceneProjection {
    this.#open();shape(context,['expectedCurrent'])
    const input=value as {kind?: unknown;revision?: unknown;snapshot?: unknown}
    shape(value,['kind','revision'],input?.kind==='Snapshot'?['snapshot']:[]);text(input.revision)
    if(input.kind==='Snapshot'){
      const snapshot=input.snapshot as {revision?: unknown}|null|undefined
      check(snapshot?.revision===input.revision,'ProjectionAdoptionError')
      return this.adopt(input.snapshot,{kind:'current',expectedCurrent:context.expectedCurrent})
    }
    check(input.kind==='NoChange','ProjectionAdoptionError')
    check(this.projection&&this.projection.revision===input.revision&&input.revision===context.expectedCurrent,'StaleProjectionDelivery')
    return this.projection
  }
  present(change: PresentationChange){
    this.#open();check(this.projection,'SceneUnavailable')
    shape(change,[],['focus','selectedItems','expandedItems','activeRegion','inspector','loading','viewMode','camera','timeCursor'])
    const ids=targets(this.projection),regions=new Set(this.projection.data.regions.map(r=>r.id))
    for(const key of ['selectedItems','expandedItems'] as const)if(Object.hasOwn(change,key)){
      check(Array.isArray(change[key])&&change[key].length<=256,'PresentationLimitExceeded')
      check(new Set(change[key]).size===change[key].length&&change[key].every(id=>ids.has(id)),'InvalidPresentationTarget')
    }
    for(const key of ['focus','inspector'] as const)if(Object.hasOwn(change,key))check(change[key]===null||ids.has(change[key]??''),'InvalidPresentationTarget')
    if(Object.hasOwn(change,'activeRegion'))check(change.activeRegion===null||regions.has(change.activeRegion??''),'InvalidPresentationTarget')
    if(Object.hasOwn(change,'loading'))check(typeof change.loading==='boolean','InvalidPresentationTarget')
    if(Object.hasOwn(change,'viewMode'))check(['spatial','structured'].includes(change.viewMode??''),'InvalidPresentationTarget')
    if(Object.hasOwn(change,'camera')){
      shape(change.camera,['x','y','z'])
      check(change.camera,'InvalidPresentationTarget')
      for(const key of ['x','y','z'] as const)check(Number.isFinite(change.camera[key])&&change.camera[key]>=(key==='z'?.65:-1)&&change.camera[key]<=(key==='z'?1.5:1),'InvalidPresentationTarget')
    }
    if(Object.hasOwn(change,'timeCursor'))check(change.timeCursor===null||this.projection.data.temporal?.items.some(item=>item.itemId===change.timeCursor),'InvalidPresentationTarget')
    // Camera is bounded local presentation, not integer-only canonical source data.
    const {camera,...rest}=change
    this.#presentation=frozen({...this.#presentation,...copy(rest),...(camera?{camera:{...camera}}:{})})
    return this.#presentation
  }
  navigate(key: string){
    this.#open();const next=this.current(key);check(next,'SceneUnavailable')
    if(this.#presentation.activeScene===key)return this.#presentation
    const navigation=[...this.#presentation.navigation.slice(0,this.#presentation.navigationIndex+1),key].slice(-64)
    this.#presentation=rebase({...empty(),navigation,navigationIndex:navigation.length-1},next)
    return this.#presentation
  }
  #move(delta: number){
    this.#open();const index=this.#presentation.navigationIndex+delta
    if(index<0||index>=this.#presentation.navigation.length)return this.#presentation
    const next=this.current(this.#presentation.navigation[index]);check(next,'SceneUnavailable')
    this.#presentation=rebase({...empty(),navigation:this.#presentation.navigation,navigationIndex:index},next)
    return this.#presentation
  }
  back(){return this.#move(-1)}
  forward(){return this.#move(1)}
  action(id: string){
    this.#open();const projection=this.projection;check(projection&&projection.data.actions.some(a=>a.id===id),'StaleSceneAction')
    return frozen({projectionKey:projection.key,projectionRevision:projection.revision,sceneId:projection.key,actionId:id})
  }
  intent(value: unknown){
    this.#open();shape(value,['projectionKey','projectionRevision','sceneId','actionId'])
    const handle=value as ActionHandle
    const p=this.projection
    check(p&&handle.projectionKey===p.key&&handle.sceneId===p.key&&handle.projectionRevision===p.revision,'StaleSceneAction')
    const action=p.data.actions.find(a=>a.id===handle.actionId);check(action,'StaleSceneAction')
    return frozen({...copy(handle),ownerCommandDescriptor:action})
  }
  inspect(){return {keys:this.#cache.size,snapshots:[...this.#cache.values()].reduce((n,v)=>n+v.length,0),closed:this.#closed}}
  close(){this.#closed=true;this.#cache.clear();this.#presentation=frozen(empty())}
}
