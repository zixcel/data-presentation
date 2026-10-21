import type {StateReadRequest} from '@crowsi/transport-foundation/state-socket'
import type {Server} from 'node:http'
import type {Asset,Delivery} from '@zixcel/view-delivery-contracts'
import type {Json} from '@zixcel/projection-contracts/client'

export interface RequestContext {readonly signal:AbortSignal}
export interface DocumentContext extends RequestContext {readonly assets:readonly Asset[]}
export interface CommandContext extends RequestContext {
  readonly requestRef:string
  observe(value:unknown):void
}
export interface DeliverySite {
  document?(url:URL,context:DocumentContext):Promise<{envelope:Delivery;bootstrap:Readonly<Record<string,Json>>}>|{envelope:Delivery;bootstrap:Readonly<Record<string,Json>>}
  read?(url:URL,context:RequestContext):unknown|Promise<unknown>
  command?(url:URL,value:unknown,context:CommandContext):unknown|Promise<unknown>
  live?(request:StateReadRequest):unknown|Promise<unknown>
  close?():void|Promise<void>
}
export interface TrustedAsset {
  readonly path:string
  readonly bytes:Uint8Array
  readonly bytesLength:number
  readonly digest:string
  readonly kind:'script'|'style'
}
export interface DeliveryServer {
  readonly server:Server
  notify():void
  inspect():{readonly alive:boolean;readonly activeRequests:number;readonly transport:{connections:number;sessions:number;subscriptions:number;pendingBytes:number}}
  listen():Promise<void>
  close():Promise<void>
}
export interface DeliveryPolicy {
  readonly owner:string
  readonly title:string
  readonly contract:string
  readonly allowedOwners:readonly string[]
  readonly cookieName?:string
  readonly csrfHeader?:string
  readonly nonceHeader?:string
  readonly readinessHeader?:string
}
export interface DeliveryServerOptions {
  readonly policy:DeliveryPolicy
  readonly origin:string
  readonly site:DeliverySite
  readonly assets:readonly TrustedAsset[]
  readonly readinessToken?:string|null
  readonly onFailure?:((failure:DeliveryFailure)=>void)|null
  readonly onOutcome?:((outcome:DeliveryOutcome)=>void)|null
}
export type OutcomeStage='DELIVERY_REJECTED'|'NOT_DISPATCHED'|'OWNER_REJECTED'|'OUTCOME_UNCERTAIN'|'OWNER_COMMITTED'|'PUBLICATION_FAILED_AFTER_COMMIT'
export interface Observation {requestRef:string;owner:string;stage:OutcomeStage;receiptRef:string|null;operation?:string;managementRequestRef?:number|null}
export interface DeliveryOutcome extends Observation {operation:string;httpStatus:number|null}
export interface DeliveryFailure {code:string;canonical:{state:string;receiptRef:string|null};ownerFailure:{owner:string;operation:string;code:string;requirementRef:string;outcomeStage:OutcomeStage;uncertain:boolean;requestRef:string;managementRequestRef:number|null;receiptRef:string|null;detail:Json}}
