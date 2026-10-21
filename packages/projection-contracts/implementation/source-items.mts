import {choice,copy,fail,json,refs,shape,text} from './contract.mjs'
import type {Item,Relation,SourceRef,Unresolved} from './types/snapshot.mjs'
export function item(v: unknown,source: SourceRef): Item|null {
  shape(v,['id','semanticRef','group','value','evidence','provenance','resolutionRefs','visibility'])
  const id=text(v.id),semanticRef=v.semanticRef===null?null:text(v.semanticRef)
  shape(v.group,['kind','ref'])
  const group={kind:choice(v.group.kind,['semantic','structural','presentation']),ref:text(v.group.ref)}
  if(group.kind==='semantic'&&group.ref!==semanticRef)fail('InvalidProjection')
  const visibility=choice(v.visibility,['visible','redacted','omitted'])
  const evidence=refs(v.evidence),provenance=refs(v.provenance),resolutionRefs=refs(v.resolutionRefs)
  if(visibility==='omitted')return null
  if(visibility==='redacted')return {id,semanticRef:null,group:{kind:'presentation',ref:'redacted'},value:null,evidence:[],provenance:[],resolutionRefs:[],visibility:'redacted',sourceRefs:[source]}
  return {...copy({id,semanticRef,group,value:json(v.value),evidence,provenance,resolutionRefs,visibility}),sourceRefs:[source]}
}
export function unresolved(v: unknown,source: SourceRef): Unresolved {
  shape(v,['id','reason','evidence','contextRefs','actionRefs'])
  return {...copy({id:text(v.id),reason:text(v.reason),evidence:refs(v.evidence),contextRefs:refs(v.contextRefs),actionRefs:refs(v.actionRefs)}),sourceRefs:[source]}
}
export function relation(v: unknown,source: SourceRef): Relation {
  shape(v,['id','from','to','relationRef'])
  return {...copy({id:text(v.id),from:text(v.from),to:text(v.to),relationRef:text(v.relationRef)}),sourceRefs:[source]}
}
