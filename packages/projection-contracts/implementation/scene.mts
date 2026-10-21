import {canonical,copy,fail,limits,list,refs,roles,shape,text,unique} from './contract.mjs'
import {validateSnapshot} from './snapshot.mjs'
import {actions as parseActions} from './scene-actions.mjs'
import {presentation as parsePresentation,temporal as parseTemporal,visibleReader} from './scene-bindings.mjs'
import {seal} from './seal.mjs'
import type {DataProjection,Region,SceneProjection} from './types/snapshot.mjs'
import type {SceneConfiguration} from './types/input.mjs'
export function scene(data: DataProjection,configuration: SceneConfiguration): SceneProjection {return buildScene(data,configuration)}
export function buildScene(value: unknown,configuration: unknown): SceneProjection {
  const data=validateSnapshot(value);if(data.kind!=='Data')fail('InvalidProjection')
  canonical(configuration);shape(configuration,['key','focus','purpose','regions','actions'],['temporal','presentation'])
  const key=text(configuration.key),focus=text(configuration.focus),purpose=text(configuration.purpose)
  const l=limits(data.lineage.request.limits),ids=new Set([...data.data.items,...data.data.unresolved].map(x=>x.id))
  const regions=unique(list(configuration.regions,l.regions).map(v=>{
    shape(v,['id','role','itemIds']);const id=text(v.id),role=text(v.role)
    if(!roles.includes(role as Region['role']))fail('InvalidProjection')
    const itemIds=unique(refs(v.itemIds,l.items));if(itemIds.some(id=>!ids.has(id)))fail('InvalidProjection')
    return {id,role:role as Region['role'],itemIds}
  }),v=>v.id)
  const actions=parseActions(configuration.actions,l.actions,data),visibleValue=visibleReader(data)
  const presentation=parsePresentation(configuration.presentation,l.items,visibleValue),temporal=parseTemporal(configuration.temporal,l.items,visibleValue)
  const lineage={...copy(data.lineage),dataProjection:{key:data.key,revision:data.revision},sceneConfiguration:copy(configuration) as unknown as SceneConfiguration}
  return seal('Scene',key,lineage,{...copy(data.data),focus,purpose,regions,actions,...(temporal?{temporal}:{}),...(presentation?{presentation}:{})},l.snapshotBytes)
}
