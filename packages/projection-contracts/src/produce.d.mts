import type { ProjectionRequest, ExactSource } from './types/input.mjs';
import type { DataProjection } from './types/snapshot.mjs';
export declare function produce(input: ProjectionRequest, exactSources: readonly ExactSource[]): DataProjection;
