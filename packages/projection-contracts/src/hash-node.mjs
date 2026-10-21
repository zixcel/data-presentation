// Generated from canonical TypeScript; do not edit.

// implementation/hash-node.mts
import { createHash } from "node:crypto";
var sha256 = (value) => createHash("sha256").update(value).digest("hex");
export {
  sha256
};
