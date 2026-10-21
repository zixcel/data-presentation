import {copy,fail,list,shape,text,unique} from './contract.mjs'
import type {DataProjection,Json,SceneProjection} from './types/snapshot.mjs'
type VisibleReader=(itemId: unknown,valuePath: unknown)=>Json
export function visibleReader(data: DataProjection): VisibleReader {
  return (itemId,valuePath)=>{
    text(itemId);const path=list(valuePath,16).map(key=>text(key,256))
    const item=data.data.items.find(item=>item.id===itemId&&item.visibility==='visible')
    if(!item)fail('InvalidProjection')
    let value=item.value
    for(const key of path){
      if(value===null||typeof value!=='object'||!Object.hasOwn(value,key))fail('InvalidProjection')
      const d=Object.getOwnPropertyDescriptor(value,key)
      if(!d||!('value' in d))fail('InvalidProjection')
      value=d.value as Json
    }
    return value
  }
}
export function presentation(value: unknown,maximum: number,visibleValue: VisibleReader): NonNullable<SceneProjection['data']['presentation']>|undefined {
  if(value===undefined)return undefined
  return unique(list(value,maximum).map(binding=>{
    shape(binding,['itemId'],['titlePath','title','summaryPath','fields','symbol']);visibleValue(binding.itemId,[])
    if(Object.hasOwn(binding,'title')===Object.hasOwn(binding,'titlePath'))fail('InvalidProjection')
    const title=text(Object.hasOwn(binding,'titlePath')?visibleValue(binding.itemId,binding.titlePath):binding.title,1024)
    const fields=binding.fields===undefined?undefined:list(binding.fields,16).map(field=>{
      shape(field,['label','valuePath']);const label=text(field.label,256)
      const value=visibleValue(binding.itemId,field.valuePath)
      if(value!==null&&typeof value!=='string'&&typeof value!=='boolean'&&typeof value!=='number')fail('InvalidProjection')
      if(typeof value==='string'&&value.length>4096)fail('ProjectionLimitExceeded')
      return {label,value}
    })
    const symbol=binding.symbol===undefined?undefined:text(binding.symbol,64)
    const summary=binding.summaryPath===undefined?undefined:text(visibleValue(binding.itemId,binding.summaryPath),2048)
    return {itemId:text(binding.itemId),title,...(summary===undefined?{}:{summary}),...(fields===undefined?{}:{fields}),...(symbol===undefined?{}:{symbol})}
  }),item=>item.itemId)
}
export function temporal(value: unknown,maximum: number,visibleValue: VisibleReader): SceneProjection['data']['temporal'] {
  if(value===undefined)return undefined
  shape(value,['label','items']);const label=text(value.label,256)
  const items=unique(list(value.items,maximum).map(binding=>{
    shape(binding,['itemId','valuePath','format']);text(binding.itemId);list(binding.valuePath,16).forEach(key=>text(key,256))
    if(binding.format!=='utcInstant'&&binding.format!=='unixMilliseconds')fail('InvalidProjection')
    let at=visibleValue(binding.itemId,binding.valuePath)
    if(binding.format==='unixMilliseconds'){
      if(typeof at!=='number'||!Number.isSafeInteger(at)||at<0||at>253402300799999)fail('InvalidProjection')
      at=new Date(at).toISOString()
    }
    if(typeof at!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(at)||!Number.isFinite(Date.parse(at))||new Date(at).toISOString()!==at)fail('InvalidProjection')
    return {itemId:text(binding.itemId),at}
  }),item=>item.itemId).sort((a,b)=>a.at===b.at?(a.itemId<b.itemId?-1:1):(a.at<b.at?-1:1))
  return {label,items}
}
