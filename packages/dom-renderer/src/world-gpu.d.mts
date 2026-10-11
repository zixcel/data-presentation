export function createGpu(canvas: any): {
    pattern(value: any): void;
    upload(data: any, ranges?: any[]): void;
    motionStates(states: any): void;
    draw(pose: any, aspect: any, zoom: any, size: any, milliseconds?: number, visibleActors?: Set<any>): void;
    readonly count: any;
    readonly stats: {
        calls: any;
        triangles: any;
        geometries: any;
        textures: any;
    };
    close: () => void;
};
export function worldGeometry(model: any, actors?: any[]): Float32Array<ArrayBuffer>;
