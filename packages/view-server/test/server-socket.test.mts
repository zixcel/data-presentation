import test from 'node:test'
import assert from 'node:assert/strict'
import {once} from 'node:events'
import WebSocket from 'ws'
import {createHash} from 'node:crypto'
import {createDeliveryServer} from '../src/index.mjs'
import {freePort,script} from './server-fixture.mts'
test('real WebSocket upgrade retains original Node request authentication and drains rejected peers',{timeout:5000},async()=>{
 const origin='http://localhost:'+await freePort()
 const server=createDeliveryServer({origin,policy:{owner:'fixture/socket',title:'Fixture',contract:'fixture/socket/1',allowedOwners:[]},assets:[{path:'/assets/app.js',kind:'script',bytes:script,bytesLength:script.length,digest:createHash('sha256').update(script).digest('hex')}],site:{}})
 await server.listen()
 try{
  const connection=await fetch(origin+'/api/connection',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'})
  const cookie=connection.headers.get('set-cookie')!.split(';')[0]
  const socket=new WebSocket(origin.replace('http:','ws:')+'/api/projection-live',{headers:{origin,cookie}})
  try{
   await once(socket,'open',{signal:AbortSignal.timeout(2000)});assert.equal(server.inspect().transport.connections,1)
   const closed=once(socket,'close',{signal:AbortSignal.timeout(2000)});socket.send('{}');await closed
   assert.equal(server.inspect().transport.connections,0)
  }finally{socket.terminate()}
  const status=await new Promise<number>((resolve,reject)=>{
   const timer=setTimeout(()=>{denied.terminate();reject(Error('Upgrade deadline'))},2000)
   const denied=new WebSocket(origin.replace('http:','ws:')+'/api/projection-live',{headers:{origin:'http://untrusted.invalid',cookie}})
   denied.once('unexpected-response',(_request,response)=>{clearTimeout(timer);response.resume();denied.terminate();resolve(response.statusCode??0)})
   denied.once('open',()=>{clearTimeout(timer);denied.terminate();reject(Error('Unexpected unauthorized upgrade'))})
   denied.on('error',()=>{})
  })
  assert.equal(status,403);assert.equal(server.inspect().transport.connections,0)
 }finally{await server.close()}
})
