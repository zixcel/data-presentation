import type { RenderItem, RenderPlan } from '@zixcel/projection-client';
export interface SceneGroup {
    id: string;
    role: string;
    items: readonly RenderItem[];
}
export type SceneButton = (label: string, kind: string, id: string, attrs?: Record<string, unknown>) => HTMLButtonElement;
export declare const reasonOf: (item: RenderItem) => string | undefined;
export declare function appendSceneItems(document: Document, board: HTMLElement, groups: readonly SceneGroup[], plan: RenderPlan, button: SceneButton): void;
