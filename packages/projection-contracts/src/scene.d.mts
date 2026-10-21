import type { DataProjection, SceneProjection } from './types/snapshot.mjs';
import type { SceneConfiguration } from './types/input.mjs';
export declare function scene(data: DataProjection, configuration: SceneConfiguration): SceneProjection;
export declare function buildScene(value: unknown, configuration: unknown): SceneProjection;
