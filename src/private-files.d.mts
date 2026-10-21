import fs from 'node:fs';
/** Refuse shared state, symlinks and hard links before reading or truncating. */
export declare function privateDirectory(directory: string): void;
export declare function privateFile(stat: fs.Stats): void;
/** Remove only an owner-private stale file; exclusive creation prevents clobbering. */
export declare function removeStaleTemporary(filename: string): void;
