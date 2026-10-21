import type { Snapshot, PublicationTicket } from '@zixcel/projection-contracts';
import type { RuntimeLimits, StoreInspection, StoreReceipt, RepairRecord } from './types/runtime.mjs';
export interface StoreKey {
    key: string;
    fence: string;
    current: string | null;
    snapshots: Snapshot[];
    receipts: StoreReceipt[];
}
export interface StoreImage {
    format: 'projection-runtime/0.10.0';
    instance: string;
    limits: Readonly<RuntimeLimits>;
    keys: StoreKey[];
    repairs: RepairRecord[];
}
export interface StoreResults {
    create: null;
    inspect: StoreInspection;
    begin: PublicationTicket;
    read: Snapshot | null;
    publish: StoreReceipt;
    pending: RepairRecord;
    repair: RepairRecord | null;
    finish: null;
    drop: null;
}
