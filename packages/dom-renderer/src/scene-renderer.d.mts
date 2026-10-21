import type { RenderPlan, ActionHandle, Camera } from '@zixcel/projection-client';
import type { WorldSurface } from './world-api.mjs';
export interface SceneActor {
    id: string;
    title: string;
    status?: string;
    preparation?: {
        label: string;
    };
}
export interface SceneGarden {
    host: HTMLElement;
    actors: readonly SceneActor[];
    activity?: unknown;
}
export interface SceneSlots {
    tools?: HTMLElement;
    details?: HTMLElement;
    actions?: HTMLElement;
    describeUnresolved?: (reason: string) => {
        label: string;
        detail: string;
    };
}
export type SceneEvents = (kind: string, value: string | ActionHandle | undefined) => void;
export declare class SceneRenderer {
    #private;
    constructor(root: HTMLElement, onEvent: SceneEvents, slots?: SceneSlots, surface?: WorldSurface | null);
    render(plan: RenderPlan): void;
    camera(value: Camera): void;
    speaker(value: SceneActor | null): void;
    garden(value: SceneGarden | null): void;
    activity(value: unknown): void;
    changeCamera(action: 'in' | 'out' | 'up' | 'down' | 'left' | 'right' | 'reset'): void;
    close(): void;
    dispose(): void;
}
