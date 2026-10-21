export interface AnchorBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
export declare function frameLayout(width: number, height: number, kind: string, anchor?: AnchorBounds | null): {
    mode: string;
    world: {
        width: number;
        height: number;
    };
    panel: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};
