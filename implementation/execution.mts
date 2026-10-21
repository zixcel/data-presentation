import {Worker} from 'node:worker_threads'
import {type ProjectionRequest,type ExactSource} from '@zixcel/projection-contracts'
import {errorCode,shape} from './common.mjs'
import type {ProducerEntry} from './types/jobs.mjs'
const workerUrl=new URL('./producer-worker.mjs',import.meta.url)
export function execute(entry: ProducerEntry,request: ProjectionRequest,sources: readonly ExactSource[],signal: AbortSignal,ms: number): Promise<unknown> {
  return new Promise((resolve,reject)=>{
    let settled=false
    const worker=new Worker(workerUrl,{workerData:{entry,request,sources},resourceLimits:{maxOldGenerationSizeMb:32,maxYoungGenerationSizeMb:8,stackSizeMb:2}})
    const finish=async(failure: unknown,value?: unknown)=>{
      if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',aborted)
      let failed=failure!==null
      try{await worker.terminate()}catch(error){if(!failed){failure=error;failed=true}}
      if(failed)reject(failure);else resolve(value)
    }
    const error=(code: string)=>Object.assign(new Error(code),{code})
    const aborted=()=>void finish(error(errorCode(signal.reason)==='ProjectionExecutionTimeout'?'ProjectionExecutionTimeout':'ProjectionCancelled'))
    const timer=setTimeout(()=>void finish(error('ProjectionExecutionTimeout')),ms)
    worker.once('error',e=>void finish(error(errorCode(e)==='ERR_WORKER_OUT_OF_MEMORY'?'ProjectionLimitExceeded':'ProjectionProducerFailed')))
    worker.once('message',(value: unknown)=>{
      try{
        if(value&&typeof value==='object'&&'error' in value){shape(value,['error']);return void finish(error(typeof value.error==='string'?value.error:'ProjectionProducerFailed'))}
        shape(value,['snapshot']);void finish(null,value.snapshot)
      }catch{void finish(error('ProjectionProducerFailed'))}
    })
    worker.once('exit',()=>{if(!settled)void finish(error('ProjectionProducerFailed'))})
    signal.addEventListener('abort',aborted,{once:true});if(signal.aborted)aborted()
  })
}
