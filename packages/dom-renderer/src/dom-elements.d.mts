export declare const renderBounds: Readonly<{
    nodes: 8192;
    depth: 20;
    textBytes: 524288;
}>;
export declare function fail(code: string): never;
export declare function element<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, text?: unknown, attrs?: Record<string, unknown>): HTMLElementTagNameMap[K];
export declare function valueView(document: Document, value: unknown, budget?: {
    nodes: number;
    bytes: number;
}): HTMLElement;
