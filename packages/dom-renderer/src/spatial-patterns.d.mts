import type { WorldObject, WorldRelation } from './world-types.mjs';
export interface SpatialState {
    pattern: string;
    groupBy: string;
    group: string | null;
    page: number;
}
export interface SpatialGroup extends WorldObject {
    kind: 'group';
    title: string;
    memberIds: string[];
}
export interface SpatialView {
    objects: WorldObject[];
    relations: WorldRelation[];
    groups: SpatialGroup[];
    state: SpatialState;
    total: number;
    pages: number;
    label: string;
}
export declare const spatialPatterns: readonly string[][];
export declare const spatialGroupings: readonly string[][];
export declare function spatialPattern(objects: WorldObject[], relations?: WorldRelation[], options?: Partial<SpatialState>): SpatialView;
