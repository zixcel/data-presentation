import type { DataProjection, Json, SceneProjection } from './types/snapshot.mjs';
type VisibleReader = (itemId: unknown, valuePath: unknown) => Json;
export declare function visibleReader(data: DataProjection): VisibleReader;
export declare function presentation(value: unknown, maximum: number, visibleValue: VisibleReader): NonNullable<SceneProjection['data']['presentation']> | undefined;
export declare function temporal(value: unknown, maximum: number, visibleValue: VisibleReader): SceneProjection['data']['temporal'];
export {};
