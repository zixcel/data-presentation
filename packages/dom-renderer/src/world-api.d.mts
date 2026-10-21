import type { Camera } from '@zixcel/projection-client';
import type { Pose, WorldObject, WorldRelation } from './world-types.mjs';
import type { SpatialState } from './spatial-patterns.mjs';
export interface RolePresentation {
    state: string;
    label: string;
}
export interface ActivityView {
    panel: HTMLElement;
    update(value: unknown): void;
    close?(): void;
}
export interface ActivityPresentation {
    describeRole?: (activity: unknown, id: string) => RolePresentation | null;
    createView?: (document: Document, host: HTMLElement) => ActivityView;
}
export interface WorldSnapshot extends Pose {
    target: string | null;
    presentation: SpatialState;
    navigation: string;
    populated: boolean;
}
export interface WorldOptions {
    objects?: WorldObject[];
    relations?: WorldRelation[];
    pose?: WorldSnapshot | null;
    onActivate?: (id: string) => void;
    conversation?: ((item: WorldObject, activate: () => void) => HTMLElement | null) | null;
    activity?: unknown;
    target?: string | null;
    pattern?: string;
    context?: string | null;
    activityPresentation?: ActivityPresentation;
}
export interface World {
    update(objects: WorldObject[], relations?: WorldRelation[]): void;
    close(): void;
    park(): void;
    mount(host: HTMLElement, options: WorldOptions): void;
    snapshot(): WorldSnapshot;
    activity(value: unknown): void;
    apply(value: Camera): void;
    change(action: string): void;
    pause(value: boolean): void;
}
export interface WorldLease {
    world: World;
    release(): void;
}
export interface WorldSurface {
    attach(host: HTMLElement, options: WorldOptions): WorldLease;
    close(): void;
}
export declare function record(value: unknown): Record<string, unknown>;
export declare function eventDetail(event: Event): Record<string, unknown>;
export declare function copyPose(value: Pose): Pose;
