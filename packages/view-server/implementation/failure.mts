import {requirement} from '@zixcel/view-delivery-contracts'
import type {OwnerFailure} from '@zixcel/view-delivery-contracts'
import type {Observation,DeliveryFailure} from './types.mjs'
import {record} from './wire.mjs'
const accessCodes=new Set(['host-rejected','origin-rejected','origin-required','fetch-site-rejected','session-capacity-reached','session-rejected','session-expired','csrf-rejected',
 'request-nonce-invalid','request-replayed','request-nonce-capacity-reached'].map(c=>'crowsi-browser-security-'+c))
const deliveryCodes=new Set(['SessionRejected','InvalidInput','DeliveryLimitExceeded','DeliveryCancelled','DeliveryTimedOut','InvalidDeliveryData',
 'InvalidAsset','NotFound','MethodNotAllowed','ProjectionCancelled','ProjectionRuntimeClosed','ProjectionQueueFull',
 'ProjectionStoreBusy','ProjectionStoreCorrupt','SourceUnavailable','SourceNotRetained','SourceRevisionMismatch',
 'ProjectionUnavailable','ProjectionLimitExceeded','ProjectionExecutionTimeout','StaleSceneAction','SceneUnavailable',
 'InteractionUnavailable','InvalidProjection','OriginRequired','SocketUnavailable'])
export function sourceFailure(value:unknown,operation:string,observation:Observation):DeliveryFailure{
 const error=record(value)
 const access=typeof error.message==='string'&&accessCodes.has(error.message),typed=record(error.failure)
 let original:OwnerFailure|null=null
 try{original=requirement({ref:typed.requirementRef,owner:typed.owner,state:'Unavailable',failure:typed,setup:null}).failure}catch{}
 const code=original?.code??(access?String(error.message):typeof error.code==='string'&&deliveryCodes.has(error.code)?error.code:
  typeof typed?.code==='string'&&/^[a-z][a-z0-9-]{2,95}$/.test(typed.code)?typed.code:'UnhandledDeliveryFault')
 return {code,canonical:{state:observation.receiptRef?'Committed':['DELIVERY_REJECTED','NOT_DISPATCHED'].includes(observation.stage)?'NotDispatched':observation.stage==='OWNER_REJECTED'?'Rejected':'Unknown',receiptRef:observation.receiptRef},ownerFailure:{owner:original?.owner??(access?'crowsi/browser-security':observation.owner),operation:original?.operation??observation.operation??operation,
  code,requirementRef:original?.requirementRef??'delivery:server',outcomeStage:observation.stage,uncertain:observation.stage==='OUTCOME_UNCERTAIN',
  requestRef:observation.requestRef,managementRequestRef:observation.managementRequestRef??null,receiptRef:observation.receiptRef,detail:original?.detail??null}}
}
