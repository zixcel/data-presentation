import type { SceneProjection } from '@zixcel/projection-contracts/client';
import type { PresentationState, RenderPlan } from './types.mjs';
export declare function renderPlan(projection: SceneProjection, presentation: PresentationState, capabilities?: {
    roles: readonly string[];
}): RenderPlan;
