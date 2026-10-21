// Snapshot delivery contracts: no framework, business policy, transport or renderer.
import {canonical,shape,text,copy,frozen} from '@zixcel/projection-contracts/client'
import {validateSnapshot} from '@zixcel/projection-contracts/client'
import {validateInputValues} from '@zixcel/interaction/input'
import type { Submission, Requirement, Readiness, Delivery } from './types.mjs'
import type { SceneProjection } from '@zixcel/projection-contracts/client'
export type * from './types.mjs'
export const bounds=Object.freeze({documentBytes:1048576,assets:8,assetBytes:1048576,requirements:16,requestBytes:32768,requests:16,bodyMs:5000})
export class DeliveryError extends Error {readonly code: string; constructor(code: string){super(code);this.code=code}}
function fail(code: string): never {throw new DeliveryError(code)}
const list=(v: unknown,maximum: number): unknown[]=>{if(!Array.isArray(v)||v.length>maximum)fail('DeliveryLimitExceeded');return v}
const object=(v: unknown,fields: string[]): Record<string,unknown>=>{shape(v,fields);return v as Record<string,unknown>}
export function validateSubmission(value: unknown): Submission {
 const fields=['projectionKey','projectionRevision','sceneId','actionId','interactionRef','generation','inputContractRef','values']
 // Preserve the existing input refusal code rather than exposing field contents.
 if(!value||Object.getPrototypeOf(value)!==Object.prototype||Object.keys(value).length!==fields.length||fields.some(k=>!Object.hasOwn(value,k)))fail('InvalidInput')
 const v=value as Record<string,unknown>
 canonical(v,bounds.requestBytes) // Refuse accessor-backed input before reading fields.
 for(const k of fields.filter(k=>k!=='values'))if(typeof v[k]!=='string'||!v[k]||v[k].length>512)fail('InvalidInput')
 const values=v.values
 if(!values||Object.getPrototypeOf(values)!==Object.prototype||Object.keys(values).length>32||Object.values(values).some(x=>!['string','boolean','number'].includes(typeof x)||typeof x==='number'&&!Number.isFinite(x)))fail('InvalidInput')
 return value as Submission
}
export function inputAction(snapshot: SceneProjection,submission: Submission){
 validateSubmission(submission);validateSnapshot(snapshot)
 if(snapshot.kind!=='Scene'||snapshot.key!==submission.sceneId||snapshot.revision!==submission.projectionRevision)fail('StaleSceneAction')
 const action=snapshot.data.actions.find(a=>a.id===submission.actionId),binding=action?.interaction
 if(!binding)fail('InteractionUnavailable')
 if(binding.ref!==submission.interactionRef||binding.generation!==submission.generation||binding.inputContractRef!==submission.inputContractRef)fail('StaleSceneAction')
 if(validateInputValues(binding.input,submission.values).length)fail('InvalidInput')
 return action
}
export function requirement(value: unknown): Requirement {
 const v=object(value,['ref','owner','state','failure','setup']);text(v.ref);text(v.owner)
 if(typeof v.state!=='string'||!['Ready','SetupRequired','Unavailable'].includes(v.state))fail('InvalidReadiness')
 if(v.state==='Ready'){if(v.failure!==null||v.setup!==null)fail('InvalidReadiness')}
 else{
  const failure=object(v.failure,['owner','operation','code','requirementRef','detail'])
  for(const k of ['owner','operation','code','requirementRef'])text(failure[k])
  if(failure.owner!==v.owner||failure.requirementRef!==v.ref)fail('InvalidReadiness')
  canonical(failure.detail,32768)
  if(v.setup!==null){const setup=object(v.setup,['id','owner','operation']);for(const x of Object.values(setup))text(x)}
 }
 return frozen(copy(v)) as Requirement
}
export function readiness(refs: readonly string[],owners: readonly unknown[]): Readiness{
 list(refs,bounds.requirements);list(owners,bounds.requirements)
 const inventory=owners.map(requirement)
 if(new Set(refs).size!==refs.length||new Set(inventory.map(v=>v.ref)).size!==inventory.length)fail('InvalidReadiness')
 const required=refs.map(ref=>{text(ref);const found=inventory.find(v=>v.ref===ref);if(!found)fail('UndeclaredRequirement');return found})
 return frozen({state:required.some(v=>v.state==='Unavailable')?'Unavailable':required.some(v=>v.state==='SetupRequired')?'SetupRequired':'Ready',requirements:required})
}
export function validateDelivery(value: unknown,expectedContract='zixcel/view-delivery/1'): Delivery {
 canonical(value,bounds.documentBytes);const v=object(value,['contract','site','initial','snapshot','readiness','assets','transport'])
 if(typeof expectedContract!=='string'||!expectedContract||expectedContract.length>128||v.contract!==expectedContract)fail('InvalidDelivery')
 const site=object(v.site,['id','revision']);text(site.id);text(site.revision)
 if(!/^[a-f0-9]{64}$/.test(text(site.revision)))fail('InvalidDelivery')
 if(v.snapshot===null){if(v.initial!==null)fail('InitialSnapshotMismatch')}
 else{
  const snapshot=validateSnapshot(v.snapshot)
  if(snapshot.kind!=='Scene'||canonical(v.initial)!==canonical({key:snapshot.key,revision:snapshot.revision,lineage:snapshot.lineage}))fail('InitialSnapshotMismatch')
 }
 const status=object(v.readiness,['state','requirements'])
 const requirements=list(status.requirements,bounds.requirements).map(requirement)
 if(canonical(readiness(requirements.map(r=>r.ref),requirements))!==canonical(v.readiness))fail('InvalidReadiness')
 const assets=list(v.assets,bounds.assets).map(a=>object(a,['path','digest','bytes','kind']))
 if(new Set(assets.map(a=>a.path)).size!==assets.length)fail('InvalidAsset')
 for(const a of assets){
  shape(a,['path','digest','bytes','kind'])
  if(typeof a.path!=='string'||!/^\/assets\/[a-zA-Z0-9._-]{1,100}$/.test(a.path)||typeof a.kind!=='string'||!['script','style'].includes(a.kind)
   ||typeof a.bytes!=='number'||!Number.isSafeInteger(a.bytes)||a.bytes<1||a.bytes>bounds.assetBytes||typeof a.digest!=='string'||!/^[a-f0-9]{64}$/.test(a.digest))fail('InvalidAsset')
 }
 if(canonical(v.transport)!==canonical({path:'/api/projection-live',classes:['STATE']}))fail('InvalidDelivery')
 return frozen(copy(v)) as unknown as Delivery
}
