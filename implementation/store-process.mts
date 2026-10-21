// One bounded child per transaction under the inherited lock. No host-wide effects.
import fs from 'node:fs'
import path from 'node:path'
import {randomUUID} from 'node:crypto'
import {bounds,check,errorCode,shape} from './common.mjs'
import {privateDirectory} from './private-files.mjs'
import {MAX,load,save} from './store-image.mjs'
import {dispatch} from './store-dispatch.mjs'
import type {StoreImage} from './store-model.mjs'
try{
 check(Number(process.argv[4])===process.ppid&&process.ppid>1,'ProjectionUnavailable')
 const directory=process.argv[2],operation=process.argv[3]
 check(typeof directory==='string'&&typeof operation==='string','InvalidProjection')
 privateDirectory(directory)
 const chunks:Buffer[]=[];let n=0
 for await(const chunk of process.stdin){
  const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk)
  n+=b.length;check(n<=MAX,'ProjectionLimitExceeded');chunks.push(b)
 }
 const input:unknown=JSON.parse(Buffer.concat(chunks).toString())
 check(input!==null&&typeof input==='object'&&!Array.isArray(input),'InvalidProjection')
 const request=input as Record<string,unknown>
 let state:StoreImage
 if(operation==='create'){
  shape(request,['limits']);check(!fs.existsSync(path.join(directory,'projection.json')),'ProjectionStoreExists')
  state={format:'projection-runtime/0.10.0',instance:randomUUID(),limits:bounds(request.limits),keys:[],repairs:[]}
  save(directory,state)
 }else state=load(directory)
 const {value,changed}=dispatch(state,operation,request)
 if(changed)save(directory,state)
 if(changed&&['publish','drop'].includes(operation))fs.utimesSync(path.join(directory,'lock'),new Date(),new Date())
 process.stdout.write(JSON.stringify({value}))
}catch(error){
 const code=errorCode(error)
 process.stdout.write(JSON.stringify({error:code?.startsWith('Projection')||code==='InvalidProjection'||code==='StaleProjectionPublication'?code:code==='ENOENT'?'ProjectionUnavailable':'ProjectionStoreCorrupt'}))
}
