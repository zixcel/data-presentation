import {canonical,produce} from '@zixcel/projection-contracts'
import type {SourceRef,ExactSource} from '@zixcel/projection-contracts'
import {check,clone,token,errorCode} from './common.mjs'
import type {SourceAdapter,SourceReader,SourceReadOptions} from './types/runtime.mjs'
// Owners retain visibility decisions, durable lease authority and bounded IO.
export class ExactSourceReader implements SourceReader {
  #owners=new Map<string,SourceAdapter>()
  constructor(owners: Map<string,SourceAdapter>){
    check(owners instanceof Map&&owners.size>0&&owners.size<=8,'ProjectionLimitExceeded')
    for(const [id,adapter] of owners){
      token(id)
      check(['acquire','read','release','releaseHolder'].every(k=>typeof adapter?.[k as keyof SourceAdapter]==='function'))
      this.#owners.set(id,Object.freeze({acquire:adapter.acquire.bind(adapter),read:adapter.read.bind(adapter),release:adapter.release.bind(adapter),releaseHolder:adapter.releaseHolder.bind(adapter)}))
    }
  }
  #owner(id: string): SourceAdapter {const owner=this.#owners.get(id);check(owner,'SourceUnavailable');return owner}
  async acquireExact(refs: readonly SourceRef[],options: SourceReadOptions): Promise<{sources:ExactSource[];leaseRefs:string[]}> {
    const {holder,accessRef,until,deadline,signal}=options;token(holder);token(accessRef)
    check(Number.isSafeInteger(until)&&Number.isSafeInteger(deadline)&&deadline<=until&&signal instanceof AbortSignal)
    check(Array.isArray(refs)&&refs.length>0&&refs.length<=8,'ProjectionLimitExceeded')
    const request={key:'source-validation',producer:{id:'source-validation',version:'0.10.0',contract:'projection/0.10.0',configuration:'source-validation'},sources:refs,focus:'source',purpose:'read',visibilityRef:accessRef,limits:{}}
    const ordered=produce(request,refs.map(source=>({source,items:[],relations:[],unresolved:[],truncated:false}))).lineage.sources
      .toSorted((a,b)=>{const x=canonical([a.owner,a.ref,a.revision,a.kind]),y=canonical([b.owner,b.ref,b.revision,b.kind]);return x<y?-1:x>y?1:0})
    ordered.forEach(r=>check(this.#owners.has(r.owner),'SourceUnavailable'))
    const running=()=>{
      check(!signal.aborted,errorCode(signal.reason)==='ProjectionExecutionTimeout'?'ProjectionExecutionTimeout':'ProjectionCancelled')
      check(Date.now()<deadline,'ProjectionExecutionTimeout')
    }
    const acquired: {source:SourceRef;lease:string}[]=[]
    try{
      for(const source of ordered){running();const lease=token(await this.#owner(source.owner).acquire(clone(source),options));acquired.push({source,lease});running()}
      const sources: ExactSource[]=[]
      for(const {source,lease} of acquired){
        running();const value=await this.#owner(source.owner).read(clone(source),lease,options)
        running();check(canonical(value?.source)===canonical(source),'SourceRevisionMismatch');sources.push(value)
      }
      canonical(sources)
      return {sources,leaseRefs:acquired.map(({source,lease})=>token(canonical([source.owner,lease])))}
    }catch(error){await this.release([],holder);throw error}
  }
  async release(leaseRefs: readonly string[],holder: string): Promise<void> {
    token(holder);check(Array.isArray(leaseRefs)&&leaseRefs.length<=8,'ProjectionLimitExceeded')
    let failed=false,failure: unknown
    const remember=(error: unknown)=>{if(!failed){failure=error;failed=true}}
    if(leaseRefs.length){
      const selected=leaseRefs.map(ref=>{
        token(ref);let value: unknown
        try{value=JSON.parse(ref)}catch{check(false)}
        check(Array.isArray(value)&&value.length===2)
        const owner=token(value[0]),lease=token(value[1]);this.#owner(owner);return {owner,lease}
      })
      for(const {owner,lease} of selected.reverse()){try{await this.#owner(owner).release(lease,holder)}catch(error){remember(error)}}
    }else{
      for(const [,owner] of [...this.#owners].sort(([a],[b])=>a<b?-1:a>b?1:0)){
        try{await owner.releaseHolder(holder)}catch(error){remember(error)}
      }
    }
    if(failed)throw failure
  }
}
