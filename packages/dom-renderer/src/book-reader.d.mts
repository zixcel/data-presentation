import type { RenderPlan } from '@zixcel/projection-client';
export interface BookPosition {
    id?: string;
    revision?: string;
    page: number;
}
type DisplayItem = RenderPlan['regions'][number]['items'][number];
export declare function bookReader(document: Document, item: DisplayItem, revision: string, close: HTMLElement, signal: AbortSignal, previous: BookPosition | null): HTMLElement;
export {};
