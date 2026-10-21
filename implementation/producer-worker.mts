import {parentPort,workerData} from 'node:worker_threads'
import {produce,scene,type ProjectionRequest,type ExactSource,type SceneConfiguration} from '@zixcel/projection-contracts'
import {check,errorCode,shape} from './common.mjs'
check(parentPort,'ProjectionProducerFailed')
try{
  const input: unknown=workerData;shape(input,['entry','request','sources'])
  shape(input.entry,['identity','kind','configuration'])
  // The wire decoders in produce/scene remain authoritative. The worker receives
  // structured clones of bounded data, never request-provided executable code.
  const request=input.request as ProjectionRequest,sources=input.sources as readonly ExactSource[]
  const ceiling=request.limits.snapshotBytes??524288
  for(const source of sources)for(const item of source.items){
    if(item.visibility==='visible'&&Buffer.byteLength(JSON.stringify(item.value))>ceiling)throw Object.assign(new Error('ProjectionLimitExceeded'),{code:'ProjectionLimitExceeded'})
  }
  const data=produce(request,sources)
  const snapshot=input.entry.kind==='scene'?scene(data,input.entry.configuration as SceneConfiguration):data
  parentPort.postMessage({snapshot})
}catch(error){parentPort.postMessage({error:errorCode(error)??'ProjectionProducerFailed'})}
parentPort.close()
