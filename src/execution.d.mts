import { type ProjectionRequest, type ExactSource } from '@zixcel/projection-contracts';
import type { ProducerEntry } from './types/jobs.mjs';
export declare function execute(entry: ProducerEntry, request: ProjectionRequest, sources: readonly ExactSource[], signal: AbortSignal, ms: number): Promise<unknown>;
