import {canonical,fail,frozen,copy,request,shape,text} from './contract.mjs'
import {produce} from './produce.mjs'
import {validateSnapshot} from './snapshot.mjs'
import type {ProjectionRequest,ReadExact,ExactSource} from './types/input.mjs'
import type {DataProjection} from './types/snapshot.mjs'
import type {Snapshot} from './types/publication.mjs'
export function rebuild(input: ProjectionRequest,readExact: ReadExact): DataProjection {
  const r=request(input)
  const sources=r.sources.map(ref=>{
    let value: unknown;try{value=readExact(ref)}catch{fail('ProjectionRebuildUnavailable')}
    if(value&&typeof value==='object'&&'then' in value){
      // Drain a native promise through the intrinsic; never assimilate a wire
      // thenable or read its getter/method. Source reads remain synchronous.
      try{Promise.prototype.then.call(value,undefined,()=>{})}catch{}
      fail('ProjectionRebuildUnavailable')
    }
    if(value==null)fail('ProjectionRebuildUnavailable')
    return value as ExactSource
  })
  return produce(r,sources)
}
export function recovery(snapshot: Snapshot,receiverRevision: string|null):
 {kind:'NoChange';revision:string}|{kind:'Snapshot';revision:string;payload:Uint8Array} {
  validateSnapshot(snapshot)
  if(receiverRevision!==null)text(receiverRevision)
  if(receiverRevision===snapshot.revision)return {kind:'NoChange',revision:snapshot.revision}
  return {kind:'Snapshot',revision:snapshot.revision,payload:Buffer.from(canonical(snapshot,524288))}
}
export function adoptSnapshot(snapshot: Snapshot,expected: {key:string;revision:string}): Readonly<Snapshot> {
  shape(expected,['key','revision']);text(expected.key);text(expected.revision);validateSnapshot(snapshot)
  if(snapshot.key!==expected.key||snapshot.revision!==expected.revision)fail('InvalidSourceRevision')
  return frozen(copy(snapshot))
}
