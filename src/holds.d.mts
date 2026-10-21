import type { SourceReader } from './types/runtime.mjs';
export interface HeldSources {
    readonly holder: string;
    readonly leases: readonly string[];
}
export declare function cleanupHolds(reader: SourceReader, sets: readonly HeldSources[]): Promise<void>;
