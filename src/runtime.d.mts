import { recovery, type ProjectionRequest } from '@zixcel/projection-contracts';
import { ProducerRegistry } from './registry.mjs';
import type { ProjectionStore, SourceReader, RuntimeLimits, SubmissionOptions } from './types/runtime.mjs';
import type { JobResult } from './types/jobs.mjs';
export { ProducerRegistry };
export { ExactSourceReader } from './exact-sources.mjs';
export type * from './types/runtime.mjs';
export declare class ProjectionRuntime {
    #private;
    constructor({ store, registry, reader, limits }: {
        store: ProjectionStore;
        registry: ProducerRegistry;
        reader: SourceReader;
        limits?: Partial<RuntimeLimits>;
    });
    inspect(): {
        active: number;
        queued: number;
        closed: boolean;
        limits: Readonly<RuntimeLimits>;
        store: import("./types/runtime.mjs").StoreInspection;
    };
    submit(input: ProjectionRequest, options: SubmissionOptions): Promise<JobResult>;
    retry(id: string, options?: Omit<SubmissionOptions, 'accessRef' | 'id'>): Promise<JobResult>;
    expire(id: string): Promise<void>;
    recoverState({ key, revision }: {
        key: string;
        revision?: string | null;
    }): ReturnType<typeof recovery> | {
        kind: 'RecoveryUnavailable';
        reason: string;
    };
    close(): Promise<void>;
}
