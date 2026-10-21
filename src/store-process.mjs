// Generated from canonical TypeScript; do not edit.

// implementation/store-process.mts
import fs2 from "node:fs";
import path2 from "node:path";
import { randomUUID as randomUUID2 } from "node:crypto";
import { bounds as bounds2, check as check4, errorCode, shape as shape4 } from "./common.mjs";
import { privateDirectory } from "./private-files.mjs";

// implementation/store-image.mts
import fs from "node:fs";
import path from "node:path";
import { validateSnapshot } from "@zixcel/projection-contracts";
import { bounds, check as check2, hash, shape as shape2, token as token2 } from "./common.mjs";
import { privateFile, removeStaleTemporary } from "./private-files.mjs";

// implementation/store-record.mts
import { canonical, produce } from "@zixcel/projection-contracts";
import { check, shape, token } from "./common.mjs";
function record(value) {
  shape(value, ["id", "holder", "previous", "ticket", "request", "producer", "accessRef", "expiresAt", "attempts", "failure", "leases"]);
  canonical(value, 65536);
  token(value.id);
  token(value.holder);
  token(value.accessRef);
  shape(value.ticket, ["key", "expected"]);
  token(value.ticket.key);
  token(value.ticket.expected);
  check(value.request !== null && typeof value.request === "object" && "key" in value.request && "sources" in value.request);
  check(value.request.key === value.ticket.key && typeof value.expiresAt === "number" && Number.isSafeInteger(value.expiresAt) && value.expiresAt > 0);
  check(typeof value.attempts === "number" && Number.isSafeInteger(value.attempts) && value.attempts >= 0);
  check(value.failure === null || typeof value.failure === "string");
  check(Array.isArray(value.request.sources) && value.request.sources.length <= 8 && Array.isArray(value.leases) && value.leases.length <= 8, "ProjectionLimitExceeded");
  const request = value.request;
  produce(request, request.sources.map((source) => ({ source, items: [], relations: [], unresolved: [], truncated: false })));
  check(canonical(value.producer) === canonical(request.producer));
  for (const ref of request.sources) shape(ref, ["owner", "ref", "revision", "kind"]);
  for (const ref of value.leases) token(ref);
  check(Array.isArray(value.previous) && value.previous.length <= 2, "ProjectionLimitExceeded");
  const holders = [];
  for (const old of value.previous) {
    shape(old, ["holder", "leases"]);
    const holder = token(old.holder);
    check(holder !== value.holder && Array.isArray(old.leases) && old.leases.length <= 8);
    old.leases.forEach(token);
    holders.push(holder);
  }
  check(new Set(holders).size === holders.length);
  return value;
}

// implementation/store-image.mts
var MAX = 12 * 1024 * 1024;
function readBounded(file, max) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    privateFile(stat);
    check2(stat.size <= max, "ProjectionStoreCorrupt");
    const bytes = Buffer.alloc(max + 1), n = fs.readSync(fd, bytes, 0, max + 1, 0);
    check2(n <= max, "ProjectionLimitExceeded");
    return bytes.subarray(0, n);
  } finally {
    fs.closeSync(fd);
  }
}
function decodeImage(value) {
  shape2(value, ["format", "instance", "limits", "keys", "repairs"]);
  check2(value.format === "projection-runtime/0.10.0", "ProjectionStoreCorrupt");
  token2(value.instance);
  const limits = bounds(value.limits);
  shape2(value.limits, Object.keys(limits));
  check2(Array.isArray(value.keys) && value.keys.length <= limits.keys && Array.isArray(value.repairs) && value.repairs.length <= limits.repairs, "ProjectionStoreCorrupt");
  const keys = [], ids = [];
  for (const k of value.keys) {
    shape2(k, ["key", "fence", "current", "snapshots", "receipts"]);
    keys.push(token2(k.key));
    token2(k.fence);
    check2(k.current === null || typeof k.current === "string", "ProjectionStoreCorrupt");
    check2(Array.isArray(k.snapshots) && k.snapshots.length <= limits.snapshots && Array.isArray(k.receipts) && k.receipts.length <= limits.snapshots, "ProjectionStoreCorrupt");
    for (const value2 of k.snapshots) {
      const snapshot = validateSnapshot(value2);
      check2(snapshot.key === k.key, "ProjectionStoreCorrupt");
    }
    const revisions = k.snapshots.map((snapshot) => snapshot.revision);
    check2(new Set(revisions).size === revisions.length, "ProjectionStoreCorrupt");
    const jobs = [];
    for (const receipt of k.receipts) {
      shape2(receipt, ["key", "expected", "publication", "revision", "jobId"]);
      check2(receipt.key === k.key, "ProjectionStoreCorrupt");
      for (const field of ["expected", "publication", "revision"]) token2(receipt[field]);
      jobs.push(token2(receipt.jobId));
    }
    check2(new Set(jobs).size === jobs.length, "ProjectionStoreCorrupt");
  }
  for (const repair of value.repairs) ids.push(record(repair).id);
  check2(new Set(keys).size === keys.length && new Set(ids).size === ids.length, "ProjectionStoreCorrupt");
  return value;
}
function load(directory) {
  const envelope = JSON.parse(readBounded(path.join(directory, "projection.json"), MAX).toString());
  shape2(envelope, ["digest", "state"]);
  check2(hash(JSON.stringify(envelope.state)) === envelope.digest, "ProjectionStoreCorrupt");
  return decodeImage(envelope.state);
}
function save(directory, state) {
  const bytes = JSON.stringify({ digest: hash(JSON.stringify(state)), state });
  check2(Buffer.byteLength(bytes) <= MAX, "ProjectionLimitExceeded");
  const temporary = path.join(directory, "projection.next");
  removeStaleTemporary(temporary);
  const fd = fs.openSync(temporary, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 384);
  try {
    fs.writeFileSync(fd, bytes);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(temporary, path.join(directory, "projection.json"));
  const dir = fs.openSync(directory, "r");
  try {
    fs.fsyncSync(dir);
  } finally {
    fs.closeSync(dir);
  }
}

// implementation/store-dispatch.mts
import { randomUUID } from "node:crypto";
import { canonical as canonical2, validateSnapshot as validateSnapshot2 } from "@zixcel/projection-contracts";
import { check as check3, clone, hash as hash2, shape as shape3, token as token3 } from "./common.mjs";
function dispatch(s, operation, input) {
  let value = null, changed = false;
  const find = (key) => s.keys.find((k) => k.key === key);
  const initial = (key) => hash2(s.instance + "\0" + token3(key));
  switch (operation) {
    case "create":
      break;
    case "inspect":
      value = { keys: s.keys.map(({ key, current, fence, snapshots }) => ({ key, current, fence, snapshots: snapshots.length })), repairs: clone(s.repairs), limits: s.limits };
      break;
    case "begin":
      value = { key: input.key, expected: find(input.key)?.fence ?? initial(input.key) };
      break;
    case "read": {
      const k = find(input.key);
      const rev = input.revision ?? k?.current;
      value = k?.snapshots.find((p) => p.revision === rev) ?? null;
      if (value) validateSnapshot2(value);
      break;
    }
    case "publish": {
      const { ticket } = input;
      const snapshot = validateSnapshot2(input.snapshot);
      const jobId = token3(input.jobId);
      shape3(ticket, ["key", "expected"]);
      token3(ticket.key);
      token3(ticket.expected);
      check3(snapshot.key === ticket.key);
      let k = find(ticket.key);
      const prior = k?.receipts.find((r) => r.jobId === jobId);
      if (prior && k) {
        check3(prior.revision === snapshot.revision, "ProjectionIdentityConflict");
        value = prior;
        if (!k.snapshots.some((p) => p.revision === snapshot.revision)) {
          k.snapshots.push(snapshot);
          k.snapshots = k.snapshots.slice(-s.limits.snapshots);
          changed = true;
        }
        if (s.repairs.some((r) => r.id === jobId)) {
          s.repairs = s.repairs.filter((r) => r.id !== jobId);
          changed = true;
        }
        break;
      }
      check3((k?.fence ?? initial(ticket.key)) === ticket.expected, "StaleProjectionPublication");
      if (!k) {
        check3(s.keys.length < s.limits.keys, "ProjectionLimitExceeded");
        k = { key: token3(ticket.key), fence: token3(ticket.expected), current: null, snapshots: [], receipts: [] };
        s.keys.push(k);
      }
      if (!k.snapshots.some((p) => p.revision === snapshot.revision)) k.snapshots.push(snapshot);
      k.snapshots = k.snapshots.slice(-s.limits.snapshots);
      k.fence = randomUUID();
      k.current = snapshot.revision;
      const receipt = { key: k.key, expected: token3(ticket.expected), publication: k.fence, revision: snapshot.revision, jobId };
      value = receipt;
      k.receipts.push(receipt);
      k.receipts = k.receipts.slice(-s.limits.snapshots);
      s.repairs = s.repairs.filter((r) => r.id !== jobId);
      changed = true;
      break;
    }
    case "pending": {
      const r = record(input.record), prior = s.repairs.find((p) => p.id === r.id);
      if (prior) {
        check3(canonical2({ ...prior, holder: null, previous: [], attempts: 0, failure: null, leases: [] }) === canonical2({ ...r, holder: null, previous: [], attempts: 0, failure: null, leases: [] }), "ProjectionIdentityConflict");
        check3(prior.holder === r.holder || input.previousHolder === prior.holder, "ProjectionAttemptConflict");
        check3(r.attempts === prior.attempts + (prior.holder === r.holder ? 0 : 1), "ProjectionAttemptConflict");
        prior.holder = r.holder;
        prior.previous = r.previous;
        prior.attempts = r.attempts;
        prior.failure = r.failure;
        prior.leases = r.leases;
      } else {
        check3(s.repairs.length < s.limits.repairs, "ProjectionLimitExceeded");
        s.repairs.push(r);
      }
      changed = true;
      value = r;
      break;
    }
    case "repair":
      value = s.repairs.find((r) => r.id === input.id) ?? null;
      break;
    case "finish":
      s.repairs = s.repairs.filter((r) => r.id !== input.id);
      changed = true;
      break;
    case "drop": {
      const k = find(input.key);
      if (k) {
        k.snapshots = [];
        changed = true;
      }
      break;
    }
    default:
      check3(false);
  }
  return { value, changed };
}

// implementation/store-process.mts
try {
  check4(Number(process.argv[4]) === process.ppid && process.ppid > 1, "ProjectionUnavailable");
  const directory = process.argv[2], operation = process.argv[3];
  check4(typeof directory === "string" && typeof operation === "string", "InvalidProjection");
  privateDirectory(directory);
  const chunks = [];
  let n = 0;
  for await (const chunk of process.stdin) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    n += b.length;
    check4(n <= MAX, "ProjectionLimitExceeded");
    chunks.push(b);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString());
  check4(input !== null && typeof input === "object" && !Array.isArray(input), "InvalidProjection");
  const request = input;
  let state;
  if (operation === "create") {
    shape4(request, ["limits"]);
    check4(!fs2.existsSync(path2.join(directory, "projection.json")), "ProjectionStoreExists");
    state = { format: "projection-runtime/0.10.0", instance: randomUUID2(), limits: bounds2(request.limits), keys: [], repairs: [] };
    save(directory, state);
  } else state = load(directory);
  const { value, changed } = dispatch(state, operation, request);
  if (changed) save(directory, state);
  if (changed && ["publish", "drop"].includes(operation)) fs2.utimesSync(path2.join(directory, "lock"), /* @__PURE__ */ new Date(), /* @__PURE__ */ new Date());
  process.stdout.write(JSON.stringify({ value }));
} catch (error) {
  const code = errorCode(error);
  process.stdout.write(JSON.stringify({ error: code?.startsWith("Projection") || code === "InvalidProjection" || code === "StaleProjectionPublication" ? code : code === "ENOENT" ? "ProjectionUnavailable" : "ProjectionStoreCorrupt" }));
}
