import { tickFrame } from './world-clock.mjs';
import type { WorldContext } from './world-context.mjs';
export declare function stopInputWorld(ctx: WorldContext): void;
export declare function stopFrameWorld(ctx: WorldContext): void;
export declare function invalidateWorld(ctx: WorldContext): void;
export declare const tickWorld: typeof tickFrame;
export declare function drawWorld(ctx: WorldContext): void;
export declare function failWorld(ctx: WorldContext, error: unknown): void;
export declare function initializeWorld(ctx: WorldContext): void;
