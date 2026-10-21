import assert from 'node:assert/strict'
import {produce as checkedProduce,scene as checkedScene,rebuild as checkedRebuild,repair as checkedRepair} from '../src/index.mjs'
// Exercise the runtime boundary with adversarial wire values. Public consumer
// type tests use the real signatures directly, including negative type tests.
function invoke<R>(fn: (...args: never[])=>R,...args: unknown[]): R {return Reflect.apply(fn,undefined,args) as R}
export const produce=(input: unknown,sources: unknown)=>invoke(checkedProduce,input,sources)
export const scene=(data: unknown,configuration: unknown)=>invoke(checkedScene,data,configuration)
export const rebuild=(input: unknown,readExact: (source: unknown)=>unknown)=>invoke(checkedRebuild,input,readExact)
export const repair=(slot: unknown,pending: unknown,readExact: (source: unknown)=>unknown)=>invoke(checkedRepair,slot,pending,readExact)
// Stop recursion at six model levels; recursive Json is not expanded without a bound.
type Mutable<T,D extends unknown[]=[1,1,1,1,1,1]>=D extends [unknown,...infer Rest]?{-readonly [K in keyof T]: Mutable<T[K],Rest>}:T
export const mutable=<T,>(value: T): Mutable<T>=>structuredClone(value) as Mutable<T>
export function defined<T>(value: T|null|undefined): T {assert.ok(value!==null&&value!==undefined);return value}
export function set(target: unknown,path: readonly string[],value: unknown): void {
 assert.ok(path.length>0);let current=target
 for(const key of path.slice(0,-1)){
  assert.ok(current!==null&&typeof current==='object'&&Object.hasOwn(current,key))
  current=Reflect.get(current,key) as unknown
 }
 assert.ok(current!==null&&typeof current==='object');Reflect.set(current,path.at(-1)!,value)
}
