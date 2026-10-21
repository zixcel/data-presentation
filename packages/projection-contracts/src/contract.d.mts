import { canonical } from './canonical.mjs';
import type { Json, RegionRole, SourceRef } from './types/snapshot.mjs';
import type { ProjectionLimits, ProjectionRequest } from './types/input.mjs';
export { canonical };
export declare class ProjectionError extends Error {
    readonly code: string;
    constructor(code: string);
}
export declare function fail(code: string): never;
export declare const LIMITS: Readonly<ProjectionLimits>;
export declare function shape(v: unknown, required: readonly string[], optional?: readonly string[]): asserts v is Record<string, unknown>;
export declare function record(v: unknown): Record<string, unknown>;
export declare function text(v: unknown, max?: number): string;
export declare function list(v: unknown, max: number): unknown[];
export declare const refs: (v: unknown, max?: number) => string[];
export declare function choice<const T extends readonly string[]>(value: unknown, values: T): T[number];
export declare function limits(input?: unknown): Readonly<ProjectionLimits>;
export declare const digest: (value: unknown) => string;
export declare function frozen<T>(value: T): Readonly<T>;
export declare const copy: <T>(v: T) => T;
export declare const json: (v: unknown) => Json;
export declare function sourceRef(v: unknown): SourceRef;
export declare const sourceKey: (v: unknown) => string;
export declare function unique<T>(values: T[], key?: (value: T) => unknown): T[];
export declare const roles: readonly RegionRole[];
export declare function request(v: unknown): ProjectionRequest & {
    readonly limits: Readonly<ProjectionLimits>;
};
