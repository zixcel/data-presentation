import type {Json} from './types/snapshot.mjs'
import {fail,text} from './contract.mjs'
const encoder=new TextEncoder()
const byteLength=(value: string)=>encoder.encode(value).length
// Only descriptor values are traversed: neither getters nor array methods run.
export function canonical(value: unknown,maximum=2097152): string {
  if(!Number.isSafeInteger(maximum)||maximum<1||maximum>2097152)fail('ProjectionLimitExceeded')
  let bytes=0,nodes=0
  const add=(n: number)=>{bytes+=n;if(bytes>maximum)fail('ProjectionLimitExceeded')}
  function walk(v: unknown,depth: number): Json {
    if(++nodes>32768||depth>16)fail('ProjectionLimitExceeded')
    if(v===null||typeof v==='boolean'){add(5);return v}
    if(typeof v==='number'){if(!Number.isSafeInteger(v))fail('InvalidProjection');add(24);return v}
    if(typeof v==='string'){if(v.length>maximum)fail('ProjectionLimitExceeded');if(!v.isWellFormed())fail('InvalidProjection');add(byteLength(v)+2);return v}
    if(Array.isArray(v)){
      const count=v.length
      add(count+2);if(count>4096)fail('ProjectionLimitExceeded')
      if(Object.getPrototypeOf(v)!==Array.prototype||Object.getOwnPropertySymbols(v).length)fail('InvalidProjection')
      if(Object.getOwnPropertyNames(v).length!==count+1)fail('InvalidProjection')
      const out: Json[]=[]
      for(let i=0;i<count;i++){
        const d=Object.getOwnPropertyDescriptor(v,String(i))
        if(!d||!d.enumerable||!('value' in d))fail('InvalidProjection')
        out.push(walk(d.value as unknown,depth+1))
      }
      return out
    }
    if(!v||typeof v!=='object'||Object.getPrototypeOf(v)!==Object.prototype)fail('InvalidProjection')
    const keys=Object.getOwnPropertyNames(v)
    if(keys.length>1024||Object.getOwnPropertySymbols(v).length)fail('ProjectionLimitExceeded')
    const out: Record<string,Json>={};add(keys.length+2)
    for(const k of keys.sort()){
      const d=Object.getOwnPropertyDescriptor(v,k)
      if(!d||!d.enumerable||!('value' in d)||['__proto__','constructor','prototype','toJSON'].includes(k))fail('InvalidProjection')
      text(k,512);add(byteLength(k)+3);out[k]=walk(d.value as unknown,depth+1)
    }
    return out
  }
  const encoded=JSON.stringify(walk(value,0))
  if(byteLength(encoded)>maximum)fail('ProjectionLimitExceeded')
  return encoded
}
