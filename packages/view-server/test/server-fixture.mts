import net from 'node:net'
import assert from 'node:assert/strict'
import {createDeliveryServer} from '../src/index.mjs'
import type {DeliveryFailure} from '../src/index.mjs'
export async function freePort(){const probe=net.createServer();await new Promise<void>(r=>probe.listen(0,'127.0.0.1',r));const address=probe.address();assert.ok(address&&typeof address!=='string');await new Promise<void>(r=>probe.close(()=>r()));return address.port}
export const invoke=(options:unknown)=>Reflect.apply(createDeliveryServer,undefined,[options])
export const script=Buffer.from('document.documentElement.dataset.delivery="trusted"')
export interface ResponseJson {csrf:string;error:DeliveryFailure;writes:number}
export async function jsonResponse(response:Response):Promise<ResponseJson>{
 const value:unknown=await response.json();assert.ok(value&&typeof value==='object'&&!Array.isArray(value));return value as ResponseJson
}
