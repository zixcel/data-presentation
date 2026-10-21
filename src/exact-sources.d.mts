import type { SourceRef, ExactSource } from '@zixcel/projection-contracts';
import type { SourceAdapter, SourceReader, SourceReadOptions } from './types/runtime.mjs';
export declare class ExactSourceReader implements SourceReader {
    #private;
    constructor(owners: Map<string, SourceAdapter>);
    acquireExact(refs: readonly SourceRef[], options: SourceReadOptions): Promise<{
        sources: ExactSource[];
        leaseRefs: string[];
    }>;
    release(leaseRefs: readonly string[], holder: string): Promise<void>;
}
