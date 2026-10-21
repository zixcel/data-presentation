import type { Camera } from '@zixcel/projection-client';
import type { WorldObject, WorldRelation } from './world-types.mjs';
import type { WorldSnapshot, WorldSurface, WorldOptions } from './world-api.mjs';
export interface SpatialPresentation {
    items?: Map<string, Partial<WorldObject>>;
    surface?: WorldSurface;
    activity?: unknown;
    target?: string | null;
    pattern?: string;
    context?: string | null;
}
export declare function spatialView(viewport: HTMLElement, board: HTMLElement, camera: Camera, relations: readonly WorldRelation[], signal: AbortSignal, pose: WorldSnapshot | null, conversation?: WorldOptions['conversation'], presentation?: SpatialPresentation): {
    change: (action: string) => void;
    apply: (value: Camera) => void;
    snapshot: () => WorldSnapshot;
    pause: (value: boolean) => void;
    activity: (value: unknown) => void;
    close: () => void;
};
