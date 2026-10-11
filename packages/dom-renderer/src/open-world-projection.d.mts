export function visibleProjection(sources: any, { x, z, radius, limit, marked }?: {
    x?: number;
    z?: number;
    radius?: number;
    limit?: number;
    marked?: any;
}): {
    items: any[];
    markers: any[];
    total: number;
    omitted: number;
};
export function mapProjection(sources: any, { selected, marked, limit }?: {
    selected?: any;
    marked?: any;
    limit?: number;
}): {
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
