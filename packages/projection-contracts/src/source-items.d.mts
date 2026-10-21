import type { Item, Relation, SourceRef, Unresolved } from './types/snapshot.mjs';
export declare function item(v: unknown, source: SourceRef): Item | null;
export declare function unresolved(v: unknown, source: SourceRef): Unresolved;
export declare function relation(v: unknown, source: SourceRef): Relation;
