import type {ProducerIdentity,ProjectionRequest,Snapshot} from '@zixcel/projection-contracts'
import type {ProducerConfiguration,RepairRecord,StoreReceipt} from './runtime.mjs'
export interface ProducerEntry {readonly identity:ProducerIdentity;readonly kind:'data'|'scene';readonly configuration:ProducerConfiguration}
export interface JobResult {readonly snapshot:Snapshot;readonly receipt:StoreReceipt}
export interface RuntimeJob {
  readonly id:string;readonly request:ProjectionRequest;readonly entry:ProducerEntry;readonly accessRef:string
  readonly controller:AbortController;readonly pending:RepairRecord|null;readonly signal:AbortSignal
  resolve(value:JobResult):void;reject(error:unknown):void;abort():void;done?:Promise<void>
}
