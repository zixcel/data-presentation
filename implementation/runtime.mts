import {randomUUID} from 'node:crypto'
import {canonical,produce,recovery,type ProjectionRequest} from '@zixcel/projection-contracts'
import {bounds,check,clone,fail,token,errorCode} from './common.mjs'
import {ProducerRegistry} from './registry.mjs'
import {runJob} from './run-job.mjs'
import {cleanupHolds,type HeldSources} from './holds.mjs'
import type {ProjectionStore,SourceReader,RuntimeLimits,SubmissionOptions} from './types/runtime.mjs'
import type {RuntimeJob,JobResult} from './types/jobs.mjs'
export {ProducerRegistry}
export {ExactSourceReader} from './exact-sources.mjs'
export type * from './types/runtime.mjs'
function validatedRequest(r: ProjectionRequest){return produce(r,r.sources.map(source=>({source,items:[],relations:[],unresolved:[],truncated:false}))).lineage.request}
export class ProjectionRuntime {
  #store: ProjectionStore;#registry: ProducerRegistry;#reader: SourceReader;#limits: Readonly<RuntimeLimits>;#active=new Map<string,RuntimeJob>();#queue: RuntimeJob[]=[];#closed=false
  constructor({store,registry,reader,limits={}}: {store:ProjectionStore;registry:ProducerRegistry;reader:SourceReader;limits?:Partial<RuntimeLimits>}){
    check(store&&registry instanceof ProducerRegistry&&typeof reader?.acquireExact==='function'&&typeof reader.release==='function')
    this.#store=store;this.#registry=registry;this.#reader=reader;this.#limits=bounds(limits)
  }
  inspect(){return {active:this.#active.size,queued:this.#queue.length,closed:this.#closed,limits:this.#limits,store:this.#store.inspect()}}
  submit(input: ProjectionRequest,options: SubmissionOptions): Promise<JobResult>
  submit(input: ProjectionRequest,{accessRef:rawAccessRef,signal=new AbortController().signal,id=randomUUID()}: Partial<SubmissionOptions>={}): Promise<JobResult> {
    check(!this.#closed,'ProjectionRuntimeClosed');const accessRef=token(rawAccessRef);token(id)
    const request=clone(input);validatedRequest(request);const entry=this.#registry.exact(request.producer)
    check(entry.kind==='data'||entry.configuration.key===request.key)
    if(this.#active.size>=this.#limits.concurrent&&this.#queue.length>=this.#limits.queued)fail('ProjectionQueueFull')
    check(!this.#active.has(id)&&!this.#queue.some(j=>j.id===id),'ProjectionIdentityConflict')
    const pending=this.#store.repair(id)
    if(pending){check(canonical(pending.request)===canonical(request)&&pending.accessRef===accessRef,'ProjectionIdentityConflict')}
    return new Promise<JobResult>((resolve,reject)=>{
      const job: RuntimeJob={id,request,entry,accessRef,controller:new AbortController(),pending,signal,resolve,reject,abort:()=>{}}
      job.abort=()=>{job.controller.abort();const index=this.#queue.indexOf(job);if(index>=0){this.#queue.splice(index,1);job.signal.removeEventListener('abort',job.abort);reject(Object.assign(new Error('ProjectionCancelled'),{code:'ProjectionCancelled'}))}}
      signal.addEventListener('abort',job.abort,{once:true})
      if(signal.aborted){signal.removeEventListener('abort',job.abort);reject(Object.assign(new Error('ProjectionCancelled'),{code:'ProjectionCancelled'}));return}
      this.#queue.push(job);this.#pump()
    })
  }
  retry(id: string,options: Omit<SubmissionOptions,'accessRef'|'id'>={}){
    const r=this.#store.repair(token(id));check(r,'ProjectionRepairUnavailable')
    return this.submit(r.request,{...options,accessRef:r.accessRef,id})
  }
  async expire(id: string){
    check(!this.#active.has(id)&&!this.#queue.some(j=>j.id===id),'ProjectionStoreBusy')
    const r=this.#store.repair(token(id));if(!r)return
    await this.#store.withAttempt(id,async()=>{
      const current=this.#store.repair(id);if(!current)return
      await this.#cleanup([{holder:current.holder,leases:current.leases},...current.previous]);this.#store.finish(id)
    })
  }
  #pump(){
    while(!this.#closed&&this.#active.size<this.#limits.concurrent&&this.#queue.length){
      const j=this.#queue.shift()!;this.#active.set(j.id,j)
      const finished=()=>{
        this.#active.delete(j.id);j.signal.removeEventListener('abort',j.abort);this.#pump()
      }
      j.done=Promise.resolve().then(()=>this.#store.withAttempt(j.id,()=>this.#run(j))).then(value=>{finished();j.resolve(value)},error=>{finished();j.reject(error)})
    }
  }
  #cleanup(sets: readonly HeldSources[]){return cleanupHolds(this.#reader,sets)}
  #run(j: RuntimeJob){return runJob(j,this.#store,this.#reader,this.#limits)}
  recoverState({key,revision=null}: {key:string;revision?:string|null}): ReturnType<typeof recovery>|{kind:'RecoveryUnavailable';reason:string} {
    try{const snapshot=this.#store.read(token(key));return snapshot?recovery(snapshot,revision):{kind:'RecoveryUnavailable',reason:'ProjectionUnavailable'}}
    catch(error){return {kind:'RecoveryUnavailable',reason:errorCode(error)??'ProjectionUnavailable'}}
  }
  async close(){
    this.#closed=true;for(const j of [...this.#queue])j.abort();for(const j of this.#active.values())j.controller.abort()
    await Promise.all([...this.#active.values()].map(j=>j.done))
  }
}
