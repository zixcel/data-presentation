import {randomUUID} from 'node:crypto'
import {canonical,produce,validateSnapshot} from '@zixcel/projection-contracts'
import {check,fail,shape,token,errorCode} from './common.mjs'
import {execute} from './execution.mjs'
import {cleanupHolds,type HeldSources} from './holds.mjs'
import type {RuntimeJob,JobResult} from './types/jobs.mjs'
import type {ProjectionStore,SourceReader,RuntimeLimits} from './types/runtime.mjs'
export async function runJob(j: RuntimeJob,store: ProjectionStore,reader: SourceReader,limits: Readonly<RuntimeLimits>): Promise<JobResult> {
    // Re-read after acquiring the process-wide attempt fence, not before queueing.
    const signal=j.controller.signal,now=Date.now(),p=store.repair(j.id),holder=randomUUID()
    if(p)check(canonical(p.request)===canonical(j.request)&&p.accessRef===j.accessRef,'ProjectionIdentityConflict')
    let ticket=p?.ticket
    const expiresAt=p?.expiresAt??now+limits.repairMs,attempts=(p?.attempts??0)+1
    if(expiresAt<=now||attempts>limits.attempts){if(p)await cleanupHolds(reader,[{holder:p.holder,leases:p.leases},...p.previous]);store.finish(j.id);fail('ProjectionRepairExpired')}
    // One deadline covers source acquisition/read, producer and publication.
    // Abort is cooperative: await actual owner IO/worker termination, never race
    // away from an acquisition which could still create a durable hold later.
    const deadline=Math.min(now+limits.executionMs,expiresAt)
    const timeout=()=>j.controller.abort(Object.assign(new Error('ProjectionExecutionTimeout'),{code:'ProjectionExecutionTimeout'}))
    let leases: readonly string[]=[],previous: HeldSources[]=p?[...p.previous,{holder:p.holder,leases:p.leases}]:[],saved=false,published=false,cleaned=false
    const timer=setTimeout(timeout,Math.max(1,deadline-Date.now()))
    const running=()=>{
      if(Date.now()>=deadline&&!signal.aborted)timeout()
      check(!signal.aborted,errorCode(signal.reason)==='ProjectionExecutionTimeout'?'ProjectionExecutionTimeout':'ProjectionCancelled')
    }
    try{
      running();ticket??=store.begin(j.request.key,{deadline});running()
      // Exact hold metadata is recorded BEFORE acquisition so interrupted readers
      // can be reconciled by deterministic holder identity, never source bodies.
      const base={id:j.id,holder,previous,ticket,request:j.request,producer:j.entry.identity,accessRef:j.accessRef,expiresAt,attempts,failure:null,leases}
      store.pending(base,{deadline,previousHolder:p?.holder});saved=true;running()
      const result=await reader.acquireExact(j.request.sources,{accessRef:j.accessRef,holder,until:expiresAt,deadline,signal})
      shape(result,['sources','leaseRefs']);check(Array.isArray(result.leaseRefs)&&result.leaseRefs.length<=8,'ProjectionLimitExceeded');result.leaseRefs.forEach(token)
      leases=result.leaseRefs;store.pending({...base,leases},{deadline})
      // Transfer physical protection only AFTER replacement exact leases are
      // durable. A crash preserves both generations for idempotent cleanup.
      await cleanupHolds(reader,previous);previous=[]
      store.pending({...base,leases,previous},{deadline})
      running();canonical(result.sources,limits.inputBytes);running()
      const output=await execute(j.entry,j.request,result.sources,signal,Math.max(1,deadline-Date.now()))
      running();const snapshot=validateSnapshot(output)
      check(canonical(snapshot.lineage.sources)===canonical(produce(j.request,result.sources).lineage.sources),'SourceRevisionMismatch')
      running();const receipt=store.publish(ticket,snapshot,j.id,{deadline});published=true
      running()
      return {snapshot,receipt}
    }catch(error){
      if(signal.aborted&&errorCode(signal.reason)==='ProjectionExecutionTimeout')error=signal.reason
      if(saved){
        check(ticket,'ProjectionStoreCorrupt')
        const terminal=attempts>=limits.attempts||['ProjectionCancelled','ProjectionExecutionTimeout','StaleProjectionPublication','SourceNotRetained','VisibilityDenied','SourceRevisionMismatch','SourceCorrupt'].includes(errorCode(error)??'')
        if(terminal){await cleanupHolds(reader,[{holder,leases},...previous]);cleaned=true;store.finish(j.id);saved=false}
        else store.pending({id:j.id,holder,previous,ticket,request:j.request,producer:j.entry.identity,accessRef:j.accessRef,expiresAt,attempts,failure:errorCode(error)??'ProjectionProducerFailed',leases})
      }
      throw error
    }finally{
      clearTimeout(timer)
      if(!cleaned&&(published||!saved))await cleanupHolds(reader,[{holder,leases},...previous])
    }
  }
