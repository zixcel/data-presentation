import type { Snapshot } from './types/publication.mjs';
type ForKind<K extends Snapshot['kind']> = Extract<Snapshot, {
    kind: K;
}>;
export declare function seal<K extends Snapshot['kind']>(kind: K, key: string, lineage: ForKind<K>['lineage'], data: ForKind<K>['data'], maximum: number): ForKind<K>;
export {};
