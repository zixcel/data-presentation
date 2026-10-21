import type { Snapshot, PublicationTicket, PublicationReceipt, PendingRepair } from './types/publication.mjs';
import type { ProjectionRequest, ReadExact } from './types/input.mjs';
export declare class ProjectionSlot {
    #private;
    constructor(key: string);
    begin(): Readonly<{
        key: string;
        expected: `${string}-${string}-${string}-${string}-${string}`;
    }>;
    publish(ticket: PublicationTicket, snapshot: Snapshot): PublicationReceipt;
    read(): Readonly<Snapshot> | null;
    dropCache(): void;
}
export declare function pendingRepair(ticket: PublicationTicket, input: ProjectionRequest, code: PendingRepair['failure']): Readonly<PendingRepair>;
export declare function repair(slot: ProjectionSlot, pending: PendingRepair, readExact: ReadExact): Readonly<PublicationReceipt>;
