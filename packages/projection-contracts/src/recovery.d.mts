import type { ProjectionRequest, ReadExact } from './types/input.mjs';
import type { DataProjection } from './types/snapshot.mjs';
import type { Snapshot } from './types/publication.mjs';
export declare function rebuild(input: ProjectionRequest, readExact: ReadExact): DataProjection;
export declare function recovery(snapshot: Snapshot, receiverRevision: string | null): {
    kind: 'NoChange';
    revision: string;
} | {
    kind: 'Snapshot';
    revision: string;
    payload: Uint8Array;
};
export declare function adoptSnapshot(snapshot: Snapshot, expected: {
    key: string;
    revision: string;
}): Readonly<Snapshot>;
