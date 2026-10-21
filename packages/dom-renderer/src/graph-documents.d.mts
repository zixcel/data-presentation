import type { InspectionOverview } from './inspection-overview.mjs';
export interface GraphDocument {
    id: string;
    label: string;
    value: unknown;
    source?: {
        method?: string;
        semanticRevision?: string;
        memoryRevision?: string;
        truncated?: boolean;
        roleRef?: {
            id?: string;
            revision?: string;
            digest_sha256?: string;
        };
    };
}
export interface GraphNode {
    id: string;
    label: string;
    path: string;
    level: number;
    value: unknown;
    document: GraphDocument;
}
export interface GraphEdge {
    from: string;
    to: string;
    label: string;
}
export interface GraphView {
    roles: readonly {
        id: string;
    }[];
    selected?: string | null;
    documents: GraphDocument[];
    overview: InspectionOverview | null;
}
export declare function graphDocuments(documents: GraphDocument[], { component, query, depth, maximum }?: {
    component?: string | undefined;
    depth?: number | undefined;
    maximum?: number | undefined;
    query?: string | undefined;
}): {
    nodes: GraphNode[];
    edges: GraphEdge[];
    truncated: boolean;
};
