import type { WorldObject, WorldRelation } from './world-types.mjs';
import type { WorldContext } from './world-context.mjs';
export declare function filterDirectoryWorld(ctx: WorldContext): void;
export declare function renderUpdatesWorld(ctx: WorldContext): void;
export declare function updateWorld(ctx: WorldContext, objects: WorldObject[], relations?: WorldRelation[]): void;
