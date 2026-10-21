import type { Submission, Requirement, Readiness, Delivery } from './types.mjs';
import type { SceneProjection } from '@zixcel/projection-contracts/client';
export type * from './types.mjs';
export declare const bounds: Readonly<{
    documentBytes: 1048576;
    assets: 8;
    assetBytes: 1048576;
    requirements: 16;
    requestBytes: 32768;
    requests: 16;
    bodyMs: 5000;
}>;
export declare class DeliveryError extends Error {
    readonly code: string;
    constructor(code: string);
}
export declare function validateSubmission(value: unknown): Submission;
export declare function inputAction(snapshot: SceneProjection, submission: Submission): import("@zixcel/projection-contracts/client").Action;
export declare function requirement(value: unknown): Requirement;
export declare function readiness(refs: readonly string[], owners: readonly unknown[]): Readiness;
export declare function validateDelivery(value: unknown, expectedContract?: string): Delivery;
