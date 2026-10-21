import type {ActivityPresentation,WorldSurface,World,WorldOptions} from './world-api.mjs'
import {createWorld} from './world-runtime.mjs'
// One explicit owner per delivery application; stale leases cannot pause a new view.
export function createWorldSurface(activityPresentation:ActivityPresentation={}):WorldSurface{
 for(const value of Object.values(activityPresentation))if(typeof value!=='function')throw Error('InvalidPresentationAdapter')
 const trustedPresentation=Object.freeze({...activityPresentation})
 let world:World|null=null,generation=0,closed=false
 return {attach(host:HTMLElement,options:WorldOptions){
  if(closed)throw Error('WorldSurfaceClosed')
  options={...options,activityPresentation:trustedPresentation}
  const lease=++generation
  if(world)world.mount(host,options);else world=createWorld(host,options)
  return {world,release(){if(lease===generation)world?.park()}}
 },close(){if(closed)return;closed=true;++generation;const previous=world;world=null;previous?.close()}}
}
