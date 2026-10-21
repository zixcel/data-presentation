import type { Gpu, ActorRange, WorldModel } from './world-types.mjs';
export declare function createGpu(canvas: HTMLCanvasElement): Gpu;
export declare function worldGeometry(model: WorldModel, actors?: ActorRange[]): Float32Array<ArrayBuffer>;
