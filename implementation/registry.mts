import fs from 'node:fs'
import {canonical,type ProducerIdentity} from '@zixcel/projection-contracts'
import {check,clone,hash,token} from './common.mjs'
import type {ProducerConfiguration} from './types/runtime.mjs'
import type {ProducerEntry} from './types/jobs.mjs'
const workerUrl=new URL('./producer-worker.mjs',import.meta.url)
const implementation=hash(Buffer.concat([
 fs.readFileSync(workerUrl),fs.readFileSync(new URL('./runtime.mjs',import.meta.url)),
 fs.readFileSync(new URL('./common.mjs',import.meta.url)),
 ...['index.mjs','contract.mjs','producer.mjs','publication.mjs','hash-node.mjs','../package.json'].map(name=>fs.readFileSync(new URL(name,import.meta.resolve('@zixcel/projection-contracts')))),
]))
export class ProducerRegistry {
  #entries=new Map<string,ProducerEntry>()
  register({id,kind,configuration={}}: {id:string;kind:'data'|'scene';configuration?:ProducerConfiguration}){
    token(id);check(['data','scene'].includes(kind));check(this.#entries.size<8,'ProjectionLimitExceeded');check(!this.#entries.has(id),'ProjectionIdentityConflict')
    canonical(configuration,16384)
    const identity={id,version:'0.10.0',contract:'projection/0.10.0',configuration:hash(canonical({implementation,kind,configuration}))}
    const entry=Object.freeze({identity:Object.freeze(identity),kind,configuration:clone(configuration)})
    this.#entries.set(id,entry);return clone(identity)
  }
  exact(identity: ProducerIdentity){const entry=this.#entries.get(identity?.id);check(entry&&canonical(entry.identity)===canonical(identity),'ProjectionProducerUnavailable');return clone(entry)}
  // Unregister only the exact installed definition. Submitted jobs already own
  // an immutable copy; stale cleanup cannot remove a different configuration.
  unregister(identity: ProducerIdentity){this.exact(identity);this.#entries.delete(identity.id)}
  get artifactDigest(){return implementation}
}
