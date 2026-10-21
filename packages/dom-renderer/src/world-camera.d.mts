import type { WorldContext } from './world-context.mjs';
export declare function objectRectWorld(ctx: WorldContext, id: string): {
    left: number;
    right: number;
    top: number;
    bottom: number;
} | null;
export declare function publishAnchorWorld(ctx: WorldContext): void;
export declare function syncOrbitWorld(ctx: WorldContext): void;
export declare function overviewWorld(ctx: WorldContext): void;
export declare function fitViewportWorld(ctx: WorldContext): void;
export declare function focusObjectWorld(ctx: WorldContext, id: string): void;
export declare function renderMapWorld(ctx: WorldContext): void;
export declare function positionBubbleWorld(ctx: WorldContext): void;
