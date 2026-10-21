export interface ProjectionPoint {
    readonly id: string;
    readonly x: number;
    readonly z: number;
    readonly title?: string;
    readonly kind?: string;
}
export interface NearbyOptions {
    x?: number;
    z?: number;
    radius?: number;
    limit?: number;
    marked?: string | null;
}
export interface MapOptions {
    selected?: string | null;
    marked?: string | null;
    limit?: number;
}
export declare function visibleProjection<T extends ProjectionPoint>(sources: readonly T[], { x, z, radius, limit, marked }?: NearbyOptions): {
    items: T[];
    markers: T[];
    total: number;
    omitted: number;
};
export declare function mapProjection<T extends ProjectionPoint>(sources: readonly T[], { selected, marked, limit }?: MapOptions): {
    items: {
        id: any;
        title: any;
        kind: any;
        x: any;
        z: any;
        selected: boolean;
        marked: boolean;
    }[];
    total: number;
    omitted: number;
};
