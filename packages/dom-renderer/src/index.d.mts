/** @template {keyof HTMLElementTagNameMap} K
 * @param {Document} document
 * @param {K} tag
 * @param {unknown} [text]
 * @param {Record<string,unknown>} [attrs]
 * @returns {HTMLElementTagNameMap[K]} */
export function element<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, text?: unknown, attrs?: Record<string, unknown>): HTMLElementTagNameMap[K];
/** @param {Document} document
 * @param {unknown} value
 * @param {{nodes:number,bytes:number}} [budget]
 * @returns {HTMLElement} */
export function valueView(document: Document, value: unknown, budget?: {
    nodes: number;
    bytes: number;
}): HTMLElement;
/** @param {Document} document
 * @param {import('@zixcel/interaction/input').InputDeclaration} declaration
 * @param {(values:Record<string,string|boolean|number>)=>unknown|Promise<unknown>} onSubmit */
export function inputForm(document: Document, declaration: import("@zixcel/interaction/input").InputDeclaration, onSubmit: (values: Record<string, string | boolean | number>) => unknown | Promise<unknown>): {
    form: HTMLFormElement;
    close(): void;
};
export { createWorldSurface } from "./world-surface.mjs";
export { symbol } from "./symbol.mjs";
export { windowFrame } from "./frame.mjs";
export { worldControlGuide } from "./world-input.mjs";
export { spatialView } from "./spatial.mjs";
export { structureGraph } from "./structure-graph.mjs";
export const renderBounds: Readonly<{
    nodes: 8192;
    depth: 20;
    textBytes: 524288;
}>;
export class SceneRenderer {
    /** @param {HTMLElement} root
     * @param {(kind:string,value:string|import('@hathq/projection-client').ActionHandle|undefined)=>void} onEvent
     * @param {{tools?:HTMLElement,details?:HTMLElement,actions?:HTMLElement}} [slots]
     * @param {ReturnType<typeof createWorldSurface>|null} [surface] */
    constructor(root: HTMLElement, onEvent: (kind: string, value: string | import("@hathq/projection-client").ActionHandle | undefined) => void, slots?: {
        tools?: HTMLElement;
        details?: HTMLElement;
        actions?: HTMLElement;
    }, surface?: ReturnType<typeof createWorldSurface> | null);
    /** @param {import('@hathq/projection-client').RenderPlan} plan */
    render(plan: import("@hathq/projection-client").RenderPlan): void;
    /** @param {import('@hathq/projection-client').Camera} value */
    camera(value: import("@hathq/projection-client").Camera): void;
    speaker(value: any): void;
    garden(value: any): void;
    activity(value: any): void;
    /** @param {'in'|'out'|'up'|'down'|'left'|'right'|'reset'} action */
    changeCamera(action: "in" | "out" | "up" | "down" | "left" | "right" | "reset"): void;
    close(): void;
    dispose(): void;
    #private;
}
import { createWorldSurface } from './world-surface.mjs';
