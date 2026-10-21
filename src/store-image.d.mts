import type { StoreImage } from './store-model.mjs';
export declare const MAX: number;
export declare function decodeImage(value: unknown): StoreImage;
export declare function load(directory: string): StoreImage;
export declare function save(directory: string, state: StoreImage): void;
