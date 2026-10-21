import type { Pose } from './world-types.mjs';
export interface FrameContext {
    frame: number | null;
    closed: boolean;
    attached: boolean;
    paused: boolean;
    lost: boolean;
    dirty: boolean;
    last: number;
    pose: Pose;
    keys: Set<unknown>;
    document: Pick<Document, 'hidden'>;
    window: Pick<Window, 'requestAnimationFrame'>;
    inputBlocked(): boolean;
    tick(now: number): void;
    draw(): void;
    fail(error: unknown): void;
}
export declare function tickFrame(ctx: FrameContext, now: number): void;
