import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {setTimeout as delay} from 'node:timers/promises'
import {createDeliveryServer} from '../src/index.mjs'
import {freePort,script,jsonResponse} from './server-fixture.mts'
test('rejected asynchronous diagnostics cannot terminate delivery or change request outcomes',{timeout:3000},async()=>{
 const origin='http://localhost:'+await freePort();let reads=0,failures=0,outcomes=0
 const server=createDeliveryServer({origin,policy:{owner:'fixture/diagnostics',title:'Fixture',contract:'fixture/diagnostics/1',allowedOwners:[]},
  assets:[{path:'/assets/app.js',kind:'script',bytes:script,bytesLength:script.length,digest:createHash('sha256').update(script).digest('hex')}],
  onFailure:async()=>{failures++;throw undefined},onOutcome:async()=>{outcomes++;throw Error('Synthetic diagnostic rejection')},site:{read:async url=>{if(url.pathname==='/api/reflection')throw Object.defineProperty({},'message',{get(){throw Error('Synthetic broken error accessor')}});return {writes:++reads}}}})
 await server.listen()
 try{
  const connection=await fetch(origin+'/api/connection',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'})
  const cookie=connection.headers.get('set-cookie')!.split(';')[0]
  const denied=await fetch(origin+'/api/status',{headers:{cookie,origin:'http://untrusted.invalid'}})
  assert.equal(denied.status,400);assert.equal(reads,0)
  assert.equal((await jsonResponse(denied)).error.ownerFailure.outcomeStage,'DELIVERY_REJECTED')
  const reflected=await fetch(origin+'/api/reflection',{headers:{cookie}})
  assert.equal(reflected.status,400);assert.equal((await jsonResponse(reflected)).error.code,'UnhandledDeliveryFault')
  const accepted=await fetch(origin+'/api/status',{headers:{cookie}})
  assert.equal(accepted.status,200);assert.deepEqual(await jsonResponse(accepted),{writes:1})
  await delay(20);assert.equal(failures,2);assert.equal(outcomes,4)
  assert.equal(server.inspect().activeRequests,0);assert.equal(server.inspect().alive,true)
 }finally{await server.close()}
})
