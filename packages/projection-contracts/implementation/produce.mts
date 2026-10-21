import {canonical,fail,list,record,request,shape,sourceKey,sourceRef,unique} from './contract.mjs'
import {item,unresolved,relation} from './source-items.mjs'
import {seal} from './seal.mjs'
import type {ProjectionRequest,ExactSource} from './types/input.mjs'
import type {DataProjection,Item,Relation,Unresolved} from './types/snapshot.mjs'
export function produce(input: ProjectionRequest,exactSources: readonly ExactSource[]): DataProjection {
  const r=request(input),l=r.limits
  canonical(exactSources);const values=list(exactSources,l.sources)
  if(values.length!==r.sources.length)fail('SourceUnavailable')
  const sources=new Map<string,Record<string,unknown>>()
  for(const value of values){
    shape(value,['source','items','relations','unresolved','truncated']);sourceRef(value.source)
    if(typeof value.truncated!=='boolean')fail('InvalidProjection')
    const key=sourceKey(value.source);if(sources.has(key))fail('InvalidSourceRevision');sources.set(key,value)
  }
  const items: Item[]=[],relations: Relation[]=[],unresolvedItems: Unresolved[]=[];let truncated=false,omitted=0
  for(const ref of r.sources){
    const s=sources.get(sourceKey(ref));if(!s)fail('InvalidSourceRevision')
    for(const v of list(s.items,l.items)){const next=item(v,ref);if(next)items.push(next);else omitted++}
    for(const v of list(s.unresolved,l.unresolved))unresolvedItems.push(unresolved(v,ref))
    for(const v of list(s.relations,l.relations))relations.push(relation(v,ref))
    truncated ||= s.truncated===true
  }
  list(items,l.items);list(relations,l.relations);list(unresolvedItems,l.unresolved)
  unique([...items,...unresolvedItems],v=>v.id);unique(relations,v=>v.id)
  const ids=new Set(items.filter(v=>v.visibility==='visible').map(v=>v.id))
  for(const v of relations)if(!ids.has(v.from)||!ids.has(v.to))fail('InvalidProjection')
  if(items.reduce((n,v)=>n+v.provenance.length,0)+unresolvedItems.reduce((n,v)=>n+v.evidence.length,0)>l.provenance)fail('ProjectionLimitExceeded')
  for(const values of [items,relations,unresolvedItems])values.sort((a,b)=>a.id<b.id?-1:1)
  return seal('Data',r.key,{sources:r.sources,producer:r.producer,request:r},
    {items,relations,unresolved:unresolvedItems,truncated,omittedByPolicy:omitted},l.snapshotBytes)
}
