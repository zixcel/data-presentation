import {frozen,roles,ProjectionError} from '@zixcel/projection-contracts/client'
import type {SceneProjection,Item,Unresolved} from '@zixcel/projection-contracts/client'
import type {PresentationState,RenderPlan,RenderItem} from './types.mjs'
function check(value: unknown,code: string): asserts value {if(!value)throw new ProjectionError(code)}
export function renderPlan(projection: SceneProjection,presentation: PresentationState,capabilities: {roles: readonly string[]}={roles}): RenderPlan{
  check(projection&&presentation.activeScene===projection.key,'RenderPlanError')
  const values=new Map([...projection.data.items,...projection.data.unresolved].map(v=>[v.id,v]))
  const selected=new Set(presentation.selectedItems),expanded=new Set(presentation.expandedItems)
  const active=(id: string)=>selected.has(id)||presentation.focus===id,related=new Set<string>()
  const relations=projection.data.relations.map(relation=>{
    const highlighted=active(relation.from)||active(relation.to)
    if(highlighted){related.add(relation.from);related.add(relation.to)}
    return {...relation,active:highlighted}
  })
  const item=(content: Item|Unresolved): RenderItem=>({id:content.id,content,focused:presentation.focus===content.id,
    selected:selected.has(content.id),expanded:expanded.has(content.id),related:related.has(content.id),
    display:projection.data.presentation?.find(binding=>binding.itemId===content.id)??null})
  const regions=projection.data.regions.map(region=>{
    check(capabilities.roles.includes(region.role),'UnsupportedRenderer')
    return {...region,items:region.itemIds.map(id=>{
      const content=values.get(id);check(content,'RenderPlanError')
      return item(content)
    })}
  })
  return frozen({projectionKey:projection.key,projectionRevision:projection.revision,sceneId:projection.key,
    purpose:projection.data.purpose,viewMode:presentation.viewMode,camera:presentation.camera,
    temporal:projection.data.temporal?{...projection.data.temporal,cursor:presentation.timeCursor}:null,
    regions,relations,actions:projection.data.actions.map(action=>({descriptor:action,
      handle:{projectionKey:projection.key,projectionRevision:projection.revision,sceneId:projection.key,actionId:action.id}})),
    inspector:presentation.inspector===null?null:values.get(presentation.inspector)??null,
    unplaced:[...values.values()].filter(v=>!projection.data.regions.some(r=>r.itemIds.includes(v.id)))
      .map(item),
    empty:values.size===0,truncated:projection.data.truncated,omittedByPolicy:projection.data.omittedByPolicy})
}
