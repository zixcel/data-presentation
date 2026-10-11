export function windowFrame(root: any, { stage, title, state, panels }: {
    stage: any;
    title: any;
    state: any;
    panels: any;
}): {
    open: (id: any, objectId?: any) => void;
    close: (restoreFocus?: boolean) => void;
    speaker(value: any): void;
    label(id: any, value: any): void;
    notify(count: any): void;
    dispose(): void;
};
