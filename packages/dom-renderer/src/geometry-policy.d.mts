import type { ActorRange } from './world-types.mjs';
/** Validate the complete upload before allocating or updating GPU state. */
export declare function admitGeometry(data: Float32Array, ranges: readonly ActorRange[]): void;
