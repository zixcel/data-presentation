import { renderPlan } from './render-plan.mjs';
export { renderPlan };
import { projectionIdentity } from './state.mjs';
export { projectionIdentity };
import type { SceneProjection } from '@zixcel/projection-contracts/client';
import type { PresentationState, PresentationChange, AdoptionContext } from './types.mjs';
export type * from './types.mjs';
export declare class ClientProjectionRuntime {
    #private;
    get projection(): SceneProjection | null;
    get presentation(): PresentationState;
    current(key: string): SceneProjection | null;
    adopt(snapshot: unknown, context: AdoptionContext): SceneProjection;
    input(value: unknown, context: {
        expectedCurrent: string | null;
    }): SceneProjection;
    present(change: PresentationChange): PresentationState;
    navigate(key: string): PresentationState;
    back(): PresentationState;
    forward(): PresentationState;
    action(id: string): Readonly<{
        projectionKey: string;
        projectionRevision: string;
        sceneId: string;
        actionId: string;
    }>;
    intent(value: unknown): Readonly<{
        projectionKey: string;
        projectionRevision: string;
        sceneId: string;
        actionId: string;
        ownerCommandDescriptor: import("@zixcel/projection-contracts/client").Action;
    }>;
    inspect(): {
        keys: number;
        snapshots: number;
        closed: boolean;
    };
    close(): void;
}
