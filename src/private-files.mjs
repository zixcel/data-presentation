// Generated from canonical TypeScript; do not edit.

// implementation/private-files.mts
import fs from "node:fs";
import { check, errorCode } from "./common.mjs";
function privateDirectory(directory) {
  const stat = fs.lstatSync(directory), uid = process.getuid?.();
  check(uid !== void 0 && stat.isDirectory() && stat.uid === uid && (stat.mode & 63) === 0, "ProjectionStoreCorrupt");
}
function privateFile(stat) {
  const uid = process.getuid?.();
  check(uid !== void 0 && stat.isFile() && stat.nlink === 1 && stat.uid === uid && (stat.mode & 63) === 0, "ProjectionStoreCorrupt");
}
function removeStaleTemporary(filename) {
  try {
    privateFile(fs.lstatSync(filename));
  } catch (error) {
    if (errorCode(error) === "ENOENT") return;
    throw error;
  }
  fs.unlinkSync(filename);
}
export {
  privateDirectory,
  privateFile,
  removeStaleTemporary
};
