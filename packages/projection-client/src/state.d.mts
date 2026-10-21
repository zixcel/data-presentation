import type { SceneProjection, ProjectionIdentity } from '@zixcel/projection-contracts/client';
import type { PresentationState } from './types.mjs';
export declare function fail(code: string): never;
export declare function check(value: unknown, code: string): asserts value;
export declare const empty: () => PresentationState;
export declare const projectionIdentity: (s: SceneProjection) => ProjectionIdentity;
export declare function sceneSnapshot(value: unknown): SceneProjection;
export declare function targets(snapshot: SceneProjection): Set<string>;
export declare function rebase(previous: PresentationState, snapshot: SceneProjection): PresentationState;
