import {canonical,digest,fail,list,record,request,shape,sourceKey,sourceRef,text,unique} from './contract.mjs'
import {item,unresolved,relation} from './source-items.mjs'
import {seal} from './seal.mjs'
import {buildScene} from './scene.mjs'
import type {SourceRef,ProjectionData} from './types/snapshot.mjs'
import type {Snapshot} from './types/publication.mjs'
export function validateSnapshot(v: unknown): Snapshot {
  canonical(v,524288);shape(v,['contract','kind','key','lineage','data','revision'])
  if(v.contract!=='projection/0.10.0'||(v.kind!=='Data'&&v.kind!=='Scene'))fail('InvalidProjection')
  const {revision,...body}=v;if(revision!=='pp:'+digest(body))fail('InvalidProjection')
  shape(v.lineage,['sources','producer','request'],v.kind==='Scene'?['dataProjection','sceneConfiguration']:[])
  const r=request(v.lineage.request),l=r.limits;text(v.key);canonical(v,l.snapshotBytes)
  const declared=record(v.lineage.request)
  if(canonical(v.lineage.sources)!==canonical(declared.sources)||canonical(v.lineage.producer)!==canonical(declared.producer))fail('InvalidProjection')
  const d=v.data
  shape(d,['items','relations','unresolved','truncated','omittedByPolicy'],v.kind==='Scene'?['focus','purpose','regions','actions','temporal','presentation']:[])
  if(typeof d.truncated!=='boolean'||typeof d.omittedByPolicy!=='number'||!Number.isSafeInteger(d.omittedByPolicy)||d.omittedByPolicy<0||d.omittedByPolicy>l.sources*l.items)fail('InvalidProjection')
  const known=new Set(r.sources.map(sourceKey))
  const checkSource=(x: Record<string,unknown>): SourceRef=>{
    const refs=list(x.sourceRefs,1)
    if(refs.length!==1||!known.has(sourceKey(refs[0])))fail('InvalidSourceRevision')
    return sourceRef(refs[0])
  }
  const items=list(d.items,l.items).map(value=>{
    const x=record(value),source=checkSource(x),{sourceRefs,...body}=x
    const parsed=item(body,source)
    if(!parsed||canonical(parsed)!==canonical(x))fail('InvalidProjection')
    return parsed
  })
  const unresolvedItems=list(d.unresolved,l.unresolved).map(value=>{
    const x=record(value),source=checkSource(x),{sourceRefs,...body}=x
    return unresolved(body,source)
  })
  unique([...items,...unresolvedItems],x=>x.id)
  const relations=unique(list(d.relations,l.relations).map(value=>{
    const x=record(value),source=checkSource(x),{sourceRefs,...body}=x
    return relation(body,source)
  }),x=>x.id)
  const ids=new Set(items.filter(x=>x.visibility==='visible').map(x=>x.id))
  for(const x of relations)if(!ids.has(x.from)||!ids.has(x.to))fail('InvalidProjection')
  if(items.reduce((n,x)=>n+x.provenance.length,0)+unresolvedItems.reduce((n,x)=>n+x.evidence.length,0)>l.provenance)fail('ProjectionLimitExceeded')
  const data: ProjectionData={items,relations,unresolved:unresolvedItems,truncated:d.truncated,omittedByPolicy:d.omittedByPolicy}
  if(v.kind==='Data'){if(v.key!==r.key)fail('InvalidProjection')}
  else{
    shape(v.lineage.dataProjection,['key','revision'])
    const base=seal('Data',r.key,{sources:r.sources,producer:r.producer,request:r},data,l.snapshotBytes)
    if(base.key!==v.lineage.dataProjection.key||base.revision!==v.lineage.dataProjection.revision)fail('InvalidProjection')
    const rebuilt=buildScene(base,v.lineage.sceneConfiguration)
    if(canonical(rebuilt)!==canonical(v))fail('InvalidProjection')
  }
  return v as unknown as Snapshot
}
