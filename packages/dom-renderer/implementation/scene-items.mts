import type {RenderItem,RenderPlan} from '@zixcel/projection-client'
import {element} from './dom-elements.mjs'
import {symbol} from './symbol.mjs'
export interface SceneGroup {id:string;role:string;items:readonly RenderItem[]}
export type SceneButton=(label:string,kind:string,id:string,attrs?:Record<string,unknown>)=>HTMLButtonElement
export const reasonOf=(item:RenderItem)=>'reason' in item.content?item.content.reason:undefined
export function appendSceneItems(document:Document,board:HTMLElement,groups:readonly SceneGroup[],plan:RenderPlan,button:SceneButton):void{
  for(const group of groups){
   const region=element(document,'section',null,{'data-region':group.id}),list=element(document,'ul',null,{class:'scene-items'})
   region.append(element(document,'h2',group.role),list)
   for(const item of group.items){
    const row=element(document,'li',null,{'data-item-id':item.id,'data-selected':item.selected,'data-related':item.related,'data-focused':item.focused}),toolbar=element(document,'div',null,{class:'item-tools'})
    const itemButton=(label:string,kind:string,attrs:Record<string,unknown>={})=>button(label,kind,item.id,{'data-control':JSON.stringify([group.id,kind,item.id]),...attrs})
    toolbar.append(itemButton(item.display?.title??reasonOf(item)??'Display not configured','select',{'aria-pressed':item.selected}),itemButton('View details','inspect',{'aria-expanded':plan.inspector?.id===item.id,'aria-haspopup':'dialog'}))
    if(reasonOf(item))toolbar.append(itemButton('Review','resolve'))
    const solid=element(document,'span',null,{class:'object-solid','aria-hidden':'true'})
    solid.append(symbol(document,item.display?.symbol??'nodes'));row.append(solid,toolbar)
    if(item.display?.summary)row.append(element(document,'p',item.display.summary,{'data-item-summary':item.id}))
    const fields=element(document,'dl',null,{class:'object-fields'})
    for(const field of item.display?.fields??[])fields.append(element(document,'dt',field.label),element(document,'dd',field.value===null?'Not set':String(field.value),{'data-projection-scalar':JSON.stringify(field.value)}))
    row.append(fields)
    if(!item.display)row.append(element(document,'p',reasonOf(item)?'This information is not yet resolved. Review the available choices or the missing requirements.':'Display information is not configured. Inspect this object in System.'))
    list.append(row)
   }
   board.append(region)
  }
}
