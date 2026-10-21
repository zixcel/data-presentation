// Generated from canonical TypeScript; do not edit.

// implementation/contract.mts
import { sha256 } from "#hash";

// implementation/canonical.mts
var encoder = new TextEncoder();
var byteLength = (value) => encoder.encode(value).length;
function canonical(value, maximum = 2097152) {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 2097152) fail("ProjectionLimitExceeded");
  let bytes = 0, nodes = 0;
  const add = (n) => {
    bytes += n;
    if (bytes > maximum) fail("ProjectionLimitExceeded");
  };
  function walk(v, depth) {
    if (++nodes > 32768 || depth > 16) fail("ProjectionLimitExceeded");
    if (v === null || typeof v === "boolean") {
      add(5);
      return v;
    }
    if (typeof v === "number") {
      if (!Number.isSafeInteger(v)) fail("InvalidProjection");
      add(24);
      return v;
    }
    if (typeof v === "string") {
      if (v.length > maximum) fail("ProjectionLimitExceeded");
      if (!v.isWellFormed()) fail("InvalidProjection");
      add(byteLength(v) + 2);
      return v;
    }
    if (Array.isArray(v)) {
      const count = v.length;
      add(count + 2);
      if (count > 4096) fail("ProjectionLimitExceeded");
      if (Object.getPrototypeOf(v) !== Array.prototype || Object.getOwnPropertySymbols(v).length) fail("InvalidProjection");
      if (Object.getOwnPropertyNames(v).length !== count + 1) fail("InvalidProjection");
      const out2 = [];
      for (let i = 0; i < count; i++) {
        const d = Object.getOwnPropertyDescriptor(v, String(i));
        if (!d || !d.enumerable || !("value" in d)) fail("InvalidProjection");
        out2.push(walk(d.value, depth + 1));
      }
      return out2;
    }
    if (!v || typeof v !== "object" || Object.getPrototypeOf(v) !== Object.prototype) fail("InvalidProjection");
    const keys = Object.getOwnPropertyNames(v);
    if (keys.length > 1024 || Object.getOwnPropertySymbols(v).length) fail("ProjectionLimitExceeded");
    const out = {};
    add(keys.length + 2);
    for (const k of keys.sort()) {
      const d = Object.getOwnPropertyDescriptor(v, k);
      if (!d || !d.enumerable || !("value" in d) || ["__proto__", "constructor", "prototype", "toJSON"].includes(k)) fail("InvalidProjection");
      text(k, 512);
      add(byteLength(k) + 3);
      out[k] = walk(d.value, depth + 1);
    }
    return out;
  }
  const encoded = JSON.stringify(walk(value, 0));
  if (byteLength(encoded) > maximum) fail("ProjectionLimitExceeded");
  return encoded;
}

// implementation/contract.mts
var encoder2 = new TextEncoder();
var ProjectionError = class extends Error {
  code;
  constructor(code) {
    super(code);
    this.code = code;
  }
};
function fail(code) {
  throw new ProjectionError(code);
}
var LIMITS = Object.freeze({ sources: 8, items: 256, relations: 512, provenance: 512, unresolved: 64, regions: 16, actions: 64, snapshotBytes: 524288 });
function shape(v, required, optional = []) {
  if (!v || typeof v !== "object" || Object.getPrototypeOf(v) !== Object.prototype || required.some((k) => !Object.hasOwn(v, k))) fail("InvalidProjection");
  for (const k of Object.getOwnPropertyNames(v)) {
    const d = Object.getOwnPropertyDescriptor(v, k);
    if (!d || !d.enumerable || !("value" in d) || !required.includes(k) && !optional.includes(k)) fail("InvalidProjection");
  }
  if (Object.getOwnPropertySymbols(v).length) fail("InvalidProjection");
}
function record(v) {
  if (!v || typeof v !== "object" || Object.getPrototypeOf(v) !== Object.prototype) fail("InvalidProjection");
  return v;
}
function text(v, max = 512) {
  if (typeof v !== "string" || !v.length || v.length > max || encoder2.encode(v).length > max || !v.isWellFormed() || /[\x00-\x1f\x7f]/u.test(v)) fail("InvalidProjection");
  return v;
}
function list(v, max) {
  if (!Array.isArray(v) || v.length > max) fail("ProjectionLimitExceeded");
  return v;
}
var refs = (v, max = 32) => list(v, max).map((x) => text(x));
function choice(value, values) {
  if (typeof value !== "string" || !values.includes(value)) fail("InvalidProjection");
  return value;
}
function limits(input = {}) {
  shape(input, [], Object.keys(LIMITS));
  const result = { ...LIMITS };
  for (const key of Object.keys(LIMITS)) {
    const value = Object.hasOwn(input, key) ? input[key] : LIMITS[key];
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > LIMITS[key]) fail("ProjectionLimitExceeded");
    result[key] = value;
  }
  return Object.freeze(result);
}
var digest = (value) => sha256(canonical(value));
function frozen(value) {
  const pending = [{ value, depth: 0 }], seen = /* @__PURE__ */ new WeakSet();
  let nodes = 0;
  while (pending.length) {
    const current = pending.pop();
    if (++nodes > 32768 || current.depth > 20) fail("ProjectionLimitExceeded");
    const v = current.value;
    if (!v || typeof v !== "object" || seen.has(v)) continue;
    seen.add(v);
    for (const key of Object.keys(v)) {
      const d = Object.getOwnPropertyDescriptor(v, key);
      if (!d || !("value" in d)) fail("InvalidProjection");
      pending.push({ value: d.value, depth: current.depth + 1 });
      if (pending.length > 32768) fail("ProjectionLimitExceeded");
    }
    Object.freeze(v);
  }
  return value;
}
var copy = (v) => JSON.parse(canonical(v));
var json = (v) => JSON.parse(canonical(v));
function sourceRef(v) {
  shape(v, ["owner", "ref", "revision", "kind"]);
  return copy({ owner: text(v.owner), ref: text(v.ref), revision: text(v.revision), kind: text(v.kind) });
}
var sourceKey = (v) => canonical(sourceRef(v));
function unique(values, key = (x) => x) {
  const ids = /* @__PURE__ */ new Set();
  for (const v of values) {
    const id = key(v);
    if (ids.has(id)) fail("InvalidProjection");
    ids.add(id);
  }
  return values;
}
var roles = Object.freeze(["Primary", "Context", "Interpretation", "Evidence", "Provenance", "Resolution", "Inspector", "Actions", "Activity"]);
function request(v) {
  canonical(v);
  shape(v, ["key", "producer", "sources", "focus", "purpose", "visibilityRef", "limits"]);
  shape(v.producer, ["id", "version", "contract", "configuration"]);
  const producer = { id: text(v.producer.id), version: text(v.producer.version), contract: text(v.producer.contract), configuration: text(v.producer.configuration) };
  const l = limits(v.limits), sources = unique(list(v.sources, l.sources).map(sourceRef), (s) => canonical([s.owner, s.ref])).sort((a, b) => sourceKey(a) < sourceKey(b) ? -1 : 1);
  if (!sources.length) fail("SourceUnavailable");
  return frozen({ key: text(v.key), producer, sources, focus: text(v.focus), purpose: text(v.purpose), visibilityRef: text(v.visibilityRef), limits: l });
}
export {
  LIMITS,
  ProjectionError,
  canonical,
  choice,
  copy,
  digest,
  fail,
  frozen,
  json,
  limits,
  list,
  record,
  refs,
  request,
  roles,
  shape,
  sourceKey,
  sourceRef,
  text,
  unique
};
