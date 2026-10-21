import {createHash,type BinaryLike} from 'node:crypto'
import {canonical,ProjectionError} from '@zixcel/projection-contracts'
import type {RuntimeLimits} from './types/runtime.mjs'
export function fail(code: string): never {throw new ProjectionError(code)}
export const hash=(bytes: BinaryLike): string=>createHash('sha256').update(bytes).digest('hex')
export const clone=<T,>(value: T): T=>JSON.parse(canonical(value)) as T
export function check(ok: unknown,code='InvalidProjection'): asserts ok {if(!ok)fail(code)}
export function shape(value: unknown,keys: readonly string[]): asserts value is Record<string,unknown> {
  check(value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k)))
  for(const key of keys){const d=Object.getOwnPropertyDescriptor(value,key);check(d&&'value' in d)}
}
export function token(value: unknown): string {
  check(typeof value==='string'&&value.length>0&&Buffer.byteLength(value)<=512&&!/[\x00-\x1f\x7f]/u.test(value));return value
}
export function errorCode(value: unknown): string|undefined {
  return value!==null&&typeof value==='object'&&'code' in value&&typeof value.code==='string'?value.code:undefined
}
export const ceilings: Readonly<RuntimeLimits>=Object.freeze({concurrent:2,queued:16,inputBytes:2097152,executionMs:5000,keys:8,snapshots:2,repairs:16,attempts:3,repairMs:300000})
export function bounds(input: unknown={}): Readonly<RuntimeLimits> {
  check(input&&typeof input==='object'&&Object.getPrototypeOf(input)===Object.prototype)
  shape(input,Object.keys(input));const b={...ceilings}
  for(const key of Object.keys(input)){
    check(Object.hasOwn(ceilings,key),'ProjectionLimitExceeded')
    const k=key as keyof RuntimeLimits,value=input[key]
    check(typeof value==='number'&&Number.isSafeInteger(value)&&value>=1&&value<=ceilings[k],'ProjectionLimitExceeded');b[k]=value
  }
  return Object.freeze(b)
}
