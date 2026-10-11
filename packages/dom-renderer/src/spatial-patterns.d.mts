export function spatialPattern(objects: any, relations?: any[], options?: {}): {
    objects: any;
    relations: any[];
    groups: any[];
    state: {
        pattern: any;
        groupBy: any;
        group: any;
        page: number;
    };
    total: any;
    pages: number;
    label: string;
} | {
    objects: any[];
    relations: any[];
    groups: any[];
    state: {
        pattern: any;
        groupBy: any;
        group: any;
        page: number;
    };
    total: number;
    pages: number;
    label: any;
};
export const spatialPatterns: readonly string[][];
export const spatialGroupings: readonly string[][];
