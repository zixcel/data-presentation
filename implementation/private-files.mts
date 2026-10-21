import fs from 'node:fs'
import {check,errorCode} from './common.mjs'
/** Refuse shared state, symlinks and hard links before reading or truncating. */
export function privateDirectory(directory: string): void {
  const stat=fs.lstatSync(directory),uid=process.getuid?.()
  check(uid!==undefined&&stat.isDirectory()&&stat.uid===uid&&(stat.mode&0o077)===0,'ProjectionStoreCorrupt')
}
export function privateFile(stat: fs.Stats): void {
  const uid=process.getuid?.()
  check(uid!==undefined&&stat.isFile()&&stat.nlink===1&&stat.uid===uid&&(stat.mode&0o077)===0,'ProjectionStoreCorrupt')
}
/** Remove only an owner-private stale file; exclusive creation prevents clobbering. */
export function removeStaleTemporary(filename: string): void {
  try{privateFile(fs.lstatSync(filename))}
  catch(error){if(errorCode(error)==='ENOENT')return;throw error}
  fs.unlinkSync(filename)
}
