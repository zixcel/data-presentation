import type { GraphView } from './graph-documents.mjs';
export { graphDocuments } from './graph-documents.mjs';
export declare function structureGraph(document: Document, host: HTMLElement, view: GraphView, onRole: (id: string) => void, onRefresh: () => unknown, { embedded }?: {
    embedded?: boolean | undefined;
}): {
    update(next: GraphView): void;
    close(): void;
};
