import {validateSnapshot,copy,frozen,ProjectionError} from '@zixcel/projection-contracts/client'
import type {SceneProjection,ProjectionIdentity} from '@zixcel/projection-contracts/client'
import type {PresentationState} from './types.mjs'
export function fail(code: string): never {throw new ProjectionError(code)}
export function check(value: unknown,code: string): asserts value {if(!value)fail(code)}
export const empty=(): PresentationState=>({activeScene:null,focus:null,selectedItems:[],expandedItems:[],activeRegion:null,
  navigation:[],navigationIndex:-1,inspector:null,loading:false,viewMode:'spatial',camera:{x:0,y:0,z:1},timeCursor:null})
export const projectionIdentity=(s: SceneProjection): ProjectionIdentity=>frozen(copy({key:s.key,revision:s.revision,lineage:s.lineage}))
export function sceneSnapshot(value: unknown): SceneProjection {const snapshot=validateSnapshot(value);check(snapshot.kind==='Scene','SceneUnavailable');return frozen(copy(snapshot))}
export function targets(snapshot: SceneProjection){return new Set([...snapshot.data.items,...snapshot.data.unresolved].map(i=>i.id))}
export function rebase(previous: PresentationState,snapshot: SceneProjection): PresentationState{
  const ids=targets(snapshot),regions=new Set(snapshot.data.regions.map(r=>r.id))
  return frozen({...previous,activeScene:snapshot.key,focus:ids.has(previous.focus??'')?previous.focus:null,
    selectedItems:previous.selectedItems.filter(id=>ids.has(id)),expandedItems:previous.expandedItems.filter(id=>ids.has(id)),
    activeRegion:regions.has(previous.activeRegion??'')?previous.activeRegion:null,inspector:ids.has(previous.inspector??'')?previous.inspector:null,
    timeCursor:snapshot.data.temporal?.items.some(item=>item.itemId===previous.timeCursor)?previous.timeCursor:null})
}
