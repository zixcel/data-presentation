import {sha256} from '#hash'
import {canonical} from './canonical.mjs'
import type {Json,RegionRole,SourceRef} from './types/snapshot.mjs'
import type {ProjectionLimits,ProjectionRequest} from './types/input.mjs'
export {canonical}
const encoder=new TextEncoder()
export class ProjectionError extends Error {readonly code: string;constructor(code: string){super(code);this.code=code}}
export function fail(code: string): never {throw new ProjectionError(code)}
export const LIMITS: Readonly<ProjectionLimits>=Object.freeze({sources:8,items:256,relations:512,provenance:512,unresolved:64,regions:16,actions:64,snapshotBytes:524288})
export function shape(v: unknown,required: readonly string[],optional: readonly string[]=[]): asserts v is Record<string,unknown> {
  if(!v||typeof v!=='object'||Object.getPrototypeOf(v)!==Object.prototype||required.some(k=>!Object.hasOwn(v,k)))fail('InvalidProjection')
  for(const k of Object.getOwnPropertyNames(v)){
    const d=Object.getOwnPropertyDescriptor(v,k)
    if(!d||!d.enumerable||!('value' in d)||(!required.includes(k)&&!optional.includes(k)))fail('InvalidProjection')
  }
  if(Object.getOwnPropertySymbols(v).length)fail('InvalidProjection')
}
export function record(v: unknown): Record<string,unknown> {
  if(!v||typeof v!=='object'||Object.getPrototypeOf(v)!==Object.prototype)fail('InvalidProjection')
  return v as Record<string,unknown>
}
export function text(v: unknown,max=512): string {
  if(typeof v!=='string'||!v.length||v.length>max||encoder.encode(v).length>max||!v.isWellFormed()||/[\x00-\x1f\x7f]/u.test(v))fail('InvalidProjection')
  return v
}
export function list(v: unknown,max: number): unknown[] {if(!Array.isArray(v)||v.length>max)fail('ProjectionLimitExceeded');return v}
export const refs=(v: unknown,max=32): string[]=>list(v,max).map(x=>text(x))
export function choice<const T extends readonly string[]>(value: unknown,values: T): T[number] {
  if(typeof value!=='string'||!values.includes(value))fail('InvalidProjection')
  return value as T[number]
}
export function limits(input: unknown={}): Readonly<ProjectionLimits> {
  shape(input,[],Object.keys(LIMITS));const result={...LIMITS}
  for(const key of Object.keys(LIMITS) as (keyof ProjectionLimits)[]){
    const value=Object.hasOwn(input,key)?input[key]:LIMITS[key]
    if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1||value>LIMITS[key])fail('ProjectionLimitExceeded')
    result[key]=value
  }
  return Object.freeze(result)
}
export const digest=(value: unknown): string=>sha256(canonical(value))
export function frozen<T>(value: T): Readonly<T> {
  const pending: {value: unknown;depth: number}[]=[{value,depth:0}],seen=new WeakSet<object>();let nodes=0
  while(pending.length){
    const current=pending.pop()!
    if(++nodes>32768||current.depth>20)fail('ProjectionLimitExceeded')
    const v=current.value;if(!v||typeof v!=='object'||seen.has(v))continue
    seen.add(v)
    for(const key of Object.keys(v)){
      const d=Object.getOwnPropertyDescriptor(v,key)
      if(!d||!('value' in d))fail('InvalidProjection')
      pending.push({value:d.value as unknown,depth:current.depth+1})
      if(pending.length>32768)fail('ProjectionLimitExceeded')
    }
    Object.freeze(v)
  }
  return value
}
export const copy=<T,>(v: T): T=>JSON.parse(canonical(v)) as T
export const json=(v: unknown): Json=>JSON.parse(canonical(v)) as Json
export function sourceRef(v: unknown): SourceRef {
  shape(v,['owner','ref','revision','kind'])
  return copy({owner:text(v.owner),ref:text(v.ref),revision:text(v.revision),kind:text(v.kind)})
}
export const sourceKey=(v: unknown): string=>canonical(sourceRef(v))
export function unique<T>(values: T[],key: (value: T)=>unknown=x=>x): T[] {
  const ids=new Set<unknown>();for(const v of values){const id=key(v);if(ids.has(id))fail('InvalidProjection');ids.add(id)}return values
}
export const roles: readonly RegionRole[]=Object.freeze(['Primary','Context','Interpretation','Evidence','Provenance','Resolution','Inspector','Actions','Activity'])
export function request(v: unknown): ProjectionRequest & {readonly limits: Readonly<ProjectionLimits>} {
  canonical(v);shape(v,['key','producer','sources','focus','purpose','visibilityRef','limits'])
  shape(v.producer,['id','version','contract','configuration'])
  const producer={id:text(v.producer.id),version:text(v.producer.version),contract:text(v.producer.contract),configuration:text(v.producer.configuration)}
  const l=limits(v.limits),sources=unique(list(v.sources,l.sources).map(sourceRef),s=>canonical([s.owner,s.ref])).sort((a,b)=>sourceKey(a)<sourceKey(b)?-1:1)
  if(!sources.length)fail('SourceUnavailable')
  return frozen({key:text(v.key),producer,sources,focus:text(v.focus),purpose:text(v.purpose),visibilityRef:text(v.visibilityRef),limits:l})
}
