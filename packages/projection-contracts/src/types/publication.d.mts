import type { DataProjection, SceneProjection } from './snapshot.mjs';
import type { ProjectionRequest } from './input.mjs';
export type Snapshot = DataProjection | SceneProjection;
export interface PublicationTicket {
    readonly key: string;
    readonly expected: string;
}
export interface PublicationReceipt extends PublicationTicket {
    readonly publication: string;
    readonly revision: string;
}
export interface PendingRepair {
    readonly ticket: PublicationTicket;
    readonly request: ProjectionRequest;
    readonly failure: 'ProjectionUnavailable' | 'ProjectionLimitExceeded';
}
