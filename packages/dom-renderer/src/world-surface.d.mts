export function createWorldSurface(activityPresentation?: {}): {
    attach(host: any, options: any): {
        world: any;
        release(): void;
    };
    close(): void;
};
