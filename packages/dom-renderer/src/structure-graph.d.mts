export function graphDocuments(documents: any, { component, query, depth, maximum }?: {
    component?: string;
    query?: string;
    depth?: number;
    maximum?: number;
}): {
    nodes: any[];
    edges: any[];
    truncated: boolean;
};
export function structureGraph(document: any, host: any, view: any, onRole: any, onRefresh: any, { embedded }?: {
    embedded?: boolean;
}): {
    update(next: any): void;
    close(): void;
};
