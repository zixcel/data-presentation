// Generated from canonical TypeScript; do not edit.

// implementation/common.mts
import { createHash } from "node:crypto";
import { canonical, ProjectionError } from "@zixcel/projection-contracts";
function fail(code) {
  throw new ProjectionError(code);
}
var hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
var clone = (value) => JSON.parse(canonical(value));
function check(ok, code = "InvalidProjection") {
  if (!ok) fail(code);
}
function shape(value, keys) {
  check(value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype && Object.keys(value).length === keys.length && keys.every((k) => Object.hasOwn(value, k)));
  for (const key of keys) {
    const d = Object.getOwnPropertyDescriptor(value, key);
    check(d && "value" in d);
  }
}
function token(value) {
  check(typeof value === "string" && value.length > 0 && Buffer.byteLength(value) <= 512 && !/[\x00-\x1f\x7f]/u.test(value));
  return value;
}
function errorCode(value) {
  return value !== null && typeof value === "object" && "code" in value && typeof value.code === "string" ? value.code : void 0;
}
var ceilings = Object.freeze({ concurrent: 2, queued: 16, inputBytes: 2097152, executionMs: 5e3, keys: 8, snapshots: 2, repairs: 16, attempts: 3, repairMs: 3e5 });
function bounds(input = {}) {
  check(input && typeof input === "object" && Object.getPrototypeOf(input) === Object.prototype);
  shape(input, Object.keys(input));
  const b = { ...ceilings };
  for (const key of Object.keys(input)) {
    check(Object.hasOwn(ceilings, key), "ProjectionLimitExceeded");
    const k = key, value = input[key];
    check(typeof value === "number" && Number.isSafeInteger(value) && value >= 1 && value <= ceilings[k], "ProjectionLimitExceeded");
    b[k] = value;
  }
  return Object.freeze(b);
}
export {
  bounds,
  ceilings,
  check,
  clone,
  errorCode,
  fail,
  hash,
  shape,
  token
};
