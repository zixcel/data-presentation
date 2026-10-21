// Linux projection-local adapter. Kernel flock, not PID/TTL lock stealing.
// Generic runtime depends only on this adapter's method contract.
import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'
import {bounds,check,fail,token,errorCode,shape} from './common.mjs'
import {privateDirectory,privateFile} from './private-files.mjs'
import type {ProjectionStore,RuntimeLimits,StoreOptions,StoreInspection,StoreReceipt,RepairRecord} from './types/runtime.mjs'
import type {PublicationTicket,Snapshot} from '@zixcel/projection-contracts'
import type {StoreResults} from './store-model.mjs'
const helper=fileURLToPath(new URL('./store-process.mjs',import.meta.url))
export class FileProjectionStore implements ProjectionStore {
  #directory: string
  constructor(directory: string){this.#directory=path.resolve(directory)}
  static create(directory: string,limits: Partial<RuntimeLimits>={}){
    check(process.platform==='linux','ProjectionStoreUnsupported')
    privateDirectory(path.dirname(path.resolve(directory)))
    const store=new FileProjectionStore(directory)
    // Caller supplies an existing private parent. Never implicitly initializes on read.
    fs.mkdirSync(store.#directory,{mode:0o700})
    const fd=fs.openSync(path.join(store.#directory,'lock'),'wx',0o600);fs.fsyncSync(fd);fs.closeSync(fd)
    // Fixed stripes bound physical lock files. Collisions return Busy, never steal
    // a live attempt by PID or wall-clock expiry. The parent retains the OFD lock.
    for(let n=0;n<16;n++){const fd=fs.openSync(path.join(store.#directory,`attempt-${n}`),'wx',0o600);fs.fsyncSync(fd);fs.closeSync(fd)}
    store.#call('create',{limits:bounds(limits)})
    return store
  }
  #call<K extends keyof StoreResults>(operation: K,input: unknown,{deadline=null}: StoreOptions={}): StoreResults[K]{
    check(deadline===null||Number.isSafeInteger(deadline),'InvalidProjection')
    const remaining=deadline===null?10000:deadline-Date.now()
    check(remaining>0,'ProjectionExecutionTimeout')
    const lock=path.join(this.#directory,'lock')
    try{privateDirectory(this.#directory);privateFile(fs.lstatSync(lock))}
    catch(e){if(errorCode(e)==='ENOENT')fail('ProjectionUnavailable');throw e}
    // Pass a pre-opened existing lock FD: flock can never create a missing file.
    const fd=fs.openSync(lock,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW)
    try{privateFile(fs.fstatSync(fd))}catch(error){fs.closeSync(fd);throw error}
    let result: ReturnType<typeof spawnSync>
    const mode=['read','inspect','repair','begin'].includes(operation)?'--shared':'--exclusive'
    // Short reads/publications serialize within a bounded kernel wait. Attempt
    // ownership remains nonblocking below; this never retries an effect or CAS.
    const waitSeconds=String(Math.min(250,remaining)/1000)
    try{result=spawnSync('/usr/bin/setpriv',['--pdeathsig','SIGKILL','--','/usr/bin/flock',mode,'--timeout',waitSeconds,'--no-fork','--conflict-exit-code','73','/proc/self/fd/3',process.execPath,helper,this.#directory,operation,String(process.pid)],
      {input:JSON.stringify(input),stdio:['pipe','pipe','pipe',fd],maxBuffer:13*1024*1024,timeout:Math.min(10000,remaining),killSignal:'SIGKILL'})}
    finally{fs.closeSync(fd)}
    if(result.status===73)fail('ProjectionStoreBusy')
    if(errorCode(result.error)==='ETIMEDOUT'&&deadline!==null)fail('ProjectionExecutionTimeout')
    if(result.error||result.status!==0)fail('ProjectionUnavailable')
    let output: unknown;try{output=JSON.parse(result.stdout.toString())}catch{fail('ProjectionStoreCorrupt')}
    check(output!==null&&typeof output==='object','ProjectionStoreCorrupt')
    if('error' in output){check(typeof output.error==='string','ProjectionStoreCorrupt');fail(output.error)}
    shape(output,['value'])
    // Reply comes from the fixed helper after its persisted-data decoder.
    return output.value as StoreResults[K]
  }
  inspect(){return this.#call('inspect',{})}
  // Hints only: readers validate the durable image under the existing lock.
  // Its mtime is touched only after publication/drop, never pending lease writes.
  // Neither this timestamp nor event delivery is a state/revision authority.
  watch(onChange: ()=>void){
    let timer: ReturnType<typeof setTimeout>|undefined,closed=false
    const notify=()=>{if(closed||timer)return;timer=setTimeout(()=>{timer=undefined;if(!closed)onChange()},20)}
    const watcher=fs.watch(this.#directory,(_event,name)=>{if(name===null||String(name)==='lock')notify()})
    watcher.on('error',notify)
    return ()=>{if(closed)return;closed=true;clearTimeout(timer);watcher.close()}
  }
  async withAttempt<T>(id: string,operation: ()=>T|PromiseLike<T>): Promise<T>{
    token(id);privateDirectory(this.#directory);let stripe=0;for(const byte of Buffer.from(id))stripe=(stripe*31+byte)%16
    let fd
    try{fd=fs.openSync(path.join(this.#directory,`attempt-${stripe}`),fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW)}
    catch(error){if(errorCode(error)==='ENOENT')fail('ProjectionUnavailable');throw error}
    try{
      privateFile(fs.fstatSync(fd))
      const result=spawnSync('/usr/bin/flock',['--exclusive','--nonblock','--conflict-exit-code','73','3'],{stdio:['ignore','pipe','pipe',fd],timeout:1000})
      if(result.status===73)fail('ProjectionStoreBusy')
      check(!result.error&&result.status===0,'ProjectionUnavailable')
      return await operation()
    }finally{fs.closeSync(fd)}
  }
  begin(key: string,options?: StoreOptions){return this.#call('begin',{key:token(key)},options)}
  read(key: string,revision: string|null=null){return this.#call('read',{key:token(key),revision})}
  publish(ticket: PublicationTicket,snapshot: Snapshot,jobId: string,options?: StoreOptions){return this.#call('publish',{ticket,snapshot,jobId:token(jobId)},options)}
  pending(record: RepairRecord,options: StoreOptions={}){return this.#call('pending',{record,previousHolder:options.previousHolder??null},options)}
  repair(id: string){return this.#call('repair',{id:token(id)})}
  finish(id: string){return this.#call('finish',{id:token(id)})}
  dropSnapshots(key: string){return this.#call('drop',{key:token(key)})}
}
