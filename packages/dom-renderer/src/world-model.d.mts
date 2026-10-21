import type { Pose, WorldObject, WorldRelation, WorldModel } from './world-types.mjs';
import { PerspectiveCamera } from 'three';
export declare const worldLimits: Readonly<{
    objects: 512;
    relations: 512;
    pixels: 1440000;
    dpr: 1.5;
    fps: 30;
    instances: 8192;
    radius: 28;
}>;
export declare const clamp: (value: number, min: number, max: number) => number;
export declare function layoutWorld<T extends WorldObject>(objects: readonly T[], relations?: readonly WorldRelation[], pattern?: string, spacing?: string): WorldModel<T>;
export declare function initialPose(): Pose;
export declare function fitPose(items: readonly {
    x: number;
    y?: number;
    z: number;
}[], aspect?: number): Pose;
export declare function movePose(pose: Pose, forward: number, side: number, seconds: number, vertical?: number): Pose;
export declare function lookPose(pose: Pose, dx: number, dy: number): Pose;
export declare function viewCamera(pose: Pose, aspect: number, zoom?: number, camera?: PerspectiveCamera): PerspectiveCamera;
export declare function cameraMatrix(pose: Pose, aspect: number, zoom?: number): import("three").Matrix4Tuple;
export declare function screenPoint(matrix: readonly number[], x: number, y: number, z: number, width: number, height: number): {
    x: number;
    y: number;
    depth: number;
    visible: boolean;
} | null;
export declare function renderSize(width: number, height: number, dpr: number): {
    width: number;
    height: number;
};
export declare function pickWorld(items: readonly (WorldObject & {
    x: number;
    y?: number;
    z: number;
})[], pose: Pose, x: number, y: number, width: number, height: number, zoom?: number): string | null;
