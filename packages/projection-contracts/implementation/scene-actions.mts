import {validateInputDeclaration,type InputDeclaration} from '@zixcel/interaction/input'
import {copy,fail,limits,list,refs,shape,sourceKey,sourceRef,text,unique} from './contract.mjs'
import type {Action,DataProjection} from './types/snapshot.mjs'
export function actions(value: unknown,maximum: number,data: DataProjection): Action[] {
  return unique(list(value,maximum).map(v=>{
    shape(v,['id','targetOwner','commandRef','contextRefs','sourceRefs','label'],['interaction'])
    const id=text(v.id),targetOwner=text(v.targetOwner),commandRef=text(v.commandRef),label=text(v.label,1024),contextRefs=refs(v.contextRefs)
    const expected=new Set(data.lineage.sources.map(sourceKey))
    const sourceRefs=list(v.sourceRefs,limits(data.lineage.request.limits).sources).map(s=>{
      if(!expected.has(sourceKey(s)))fail('InvalidSourceRevision');return sourceRef(s)
    })
    if(!sourceRefs.length)fail('InvalidSourceRevision')
    let interaction: Action['interaction']
    if(v.interaction!==undefined){
      const i=v.interaction;shape(i,['ref','generation','inputContractRef','input'])
      const ref=text(i.ref),generation=text(i.generation),inputContractRef=text(i.inputContractRef)
      if(validateInputDeclaration(i.input).length)fail('InvalidProjection')
      const input=i.input as InputDeclaration
      if(input.action.contract_revision!==inputContractRef||input.action.operation_id!==commandRef)fail('InvalidProjection')
      interaction={ref,generation,inputContractRef,input:copy(input)}
    }
    return copy({id,targetOwner,commandRef,label,contextRefs,sourceRefs,...(interaction===undefined?{}:{interaction})})
  }),v=>v.id)
}
