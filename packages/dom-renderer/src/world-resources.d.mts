interface Clearable {
    clear(): void;
}
interface Closable {
    close(): void;
}
export interface WorldResources {
    engine?: {
        close?(): void;
    };
    stopInput?: () => void;
    stopFrame?: () => void;
    resize?: {
        disconnect(): void;
    };
    controller?: {
        abort(): void;
    };
    orbit?: {
        dispose(): void;
    };
    gpu?: Closable | null;
    canvas?: Pick<HTMLCanvasElement, 'getContext'>;
    initializations?: number;
    labelNodes?: Clearable;
    directoryNodes?: Clearable;
    recent?: Clearable;
    poses?: Clearable;
    wrap?: {
        remove(): void;
    };
}
export declare function disposeWorldResources(ctx: WorldResources, gpu?: Closable | null | undefined): void;
export {};
