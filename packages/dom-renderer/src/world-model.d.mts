export function layoutWorld(objects: any, relations?: any[], pattern?: string, spacing?: string): {
    pattern?: string;
    items: any[];
    relations: any[];
};
export function initialPose(): {
    x: number;
    y: number;
    z: number;
    yaw: number;
    pitch: number;
};
export function fitPose(items: any, aspect?: number): {
    x: any;
    y: any;
    z: any;
    yaw: number;
    pitch: number;
    focus: {
        x: any;
        y: any;
        z: any;
    };
};
export function movePose(pose: any, forward: any, side: any, seconds: any, vertical?: number): any;
export function lookPose(pose: any, dx: any, dy: any): any;
export function viewCamera(pose: any, aspect: any, zoom?: number, camera?: any): any;
export function cameraMatrix(pose: any, aspect: any, zoom?: number): any;
export function screenPoint(matrix: any, x: any, y: any, z: any, width: any, height: any): {
    x: number;
    y: number;
    depth: number;
    visible: boolean;
};
export function renderSize(width: any, height: any, dpr: any): {
    width: number;
    height: number;
};
export function pickWorld(items: any, pose: any, x: any, y: any, width: any, height: any, zoom?: number): any;
export const worldLimits: Readonly<{
    objects: 512;
    relations: 512;
    pixels: 1440000;
    dpr: 1.5;
    fps: 30;
    instances: 8192;
    radius: 28;
}>;
export function clamp(value: any, min: any, max: any): number;
