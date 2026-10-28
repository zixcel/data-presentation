import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {once} from 'node:events'
import {readFile} from 'node:fs/promises'
import {build,stop} from 'esbuild'
import {chromium} from '@playwright/test'
import type {Browser} from '@playwright/test'
import {compactThreeShaders} from '../src/compact-shaders.mjs'
export async function withWorldBrowser(run:(browser:Browser,url:string)=>Promise<void>):Promise<void>{
 let browser:Browser|undefined,server:ReturnType<typeof createServer>|undefined,failed=false,primary:unknown
 try{
  const root=new URL('../',import.meta.url).pathname
  const bundle=await build({entryPoints:[new URL('./fixtures/world-app.mts',import.meta.url).pathname],bundle:true,format:'esm',write:false,logLevel:'silent',plugins:[compactThreeShaders()]})
  assert.deepEqual(bundle.warnings,[]);assert.equal(bundle.outputFiles.length,1)
  const css=await readFile(root+'src/style.css','utf8')
  server=createServer((request,response)=>{response.setHeader('content-type',request.url==='/app.js'?'text/javascript':request.url==='/style.css'?'text/css':'text/html');response.end(request.url==='/app.js'?bundle.outputFiles[0].text:request.url==='/style.css'?css:'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><title>Thinking garden · isolated renderer test</title><main id="stage" class="delivery-shell"></main><script type="module" src="/app.js"></script></html>')})
  server.listen(0,'127.0.0.1');await once(server,'listening')
  const address=server.address();assert.ok(address&&typeof address!=='string')
  browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
  await run(browser,'http://127.0.0.1:'+address.port)
 }catch(error){failed=true;primary=error}
 const results=await Promise.allSettled([browser?.close(),new Promise<void>((resolve,reject)=>{
  if(!server?.listening)return resolve()
  server.close(error=>error?reject(error):resolve());server.closeIdleConnections();server.closeAllConnections()
 })])
 const failures=results.filter((r):r is PromiseRejectedResult=>r.status==='rejected').map(r=>r.reason as unknown)
 try{stop()}catch(error){failures.push(error)}
 if(failed&&failures.length)throw new AggregateError([primary,...failures],'Browser acceptance and cleanup failed')
 if(failed)throw primary
 if(failures.length)throw new AggregateError(failures,'Browser acceptance cleanup failed')
}
