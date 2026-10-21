import type { RuntimeJob, JobResult } from './types/jobs.mjs';
import type { ProjectionStore, SourceReader, RuntimeLimits } from './types/runtime.mjs';
export declare function runJob(j: RuntimeJob, store: ProjectionStore, reader: SourceReader, limits: Readonly<RuntimeLimits>): Promise<JobResult>;
