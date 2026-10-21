export interface FramePanel {
    id: string;
    label: string;
    symbol: string;
    nodes?: readonly Node[];
    activate?: () => void;
    dock?: boolean;
}
export interface FrameOptions {
    stage: Node;
    title: Node;
    state: HTMLElement;
    panels: FramePanel[];
}
export declare function windowFrame(root: HTMLElement, { stage, title, state, panels }: FrameOptions): {
    open: (id: string, objectId?: string | null) => void;
    close: (restoreFocus?: boolean) => void;
    speaker(value: {
        id: string;
        title?: string;
    } | null): void;
    label(id: string, value: string): void;
    notify(count: number): void;
    dispose(): void;
};
