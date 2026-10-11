export function createWorld(host: any, { objects, relations, pose: restored, onActivate, conversation, activity, target, pattern, context, activityPresentation }?: {
    objects?: any[];
    relations?: any[];
    onActivate?: () => void;
    conversation?: any;
    activity?: any;
    target?: any;
    pattern?: string;
    context?: any;
    activityPresentation?: {};
}): {
    update: (objects: any, relations?: any[]) => void;
    close: () => void;
    mount: (nextHost: any, options: any) => void;
    park: () => void;
    snapshot: () => {
        target: any;
        presentation: any;
        navigation: string;
        populated: boolean;
        x: number;
        y: number;
        z: number;
        yaw: number;
        pitch: number;
    } | {
        target: any;
        presentation: any;
        navigation: string;
        populated: boolean;
    };
    activity(value: any): void;
    apply(value: any): void;
    change(action: any): void;
    pause(value: any): void;
};
