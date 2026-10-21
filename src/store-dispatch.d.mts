import type { StoreImage } from './store-model.mjs';
export declare function dispatch(s: StoreImage, operation: string, input: Record<string, unknown>): {
    value: unknown;
    changed: boolean;
};
