// Generated from canonical TypeScript; do not edit.

// implementation/runtime.mts
import { randomUUID as randomUUID2 } from "node:crypto";
import { canonical as canonical3, produce as produce2, recovery } from "@zixcel/projection-contracts";
import { bounds, check as check3, clone as clone2, fail as fail2, token as token3, errorCode as errorCode3 } from "./common.mjs";

// implementation/registry.mts
import fs from "node:fs";
import { canonical } from "@zixcel/projection-contracts";
import { check, clone, hash, token } from "./common.mjs";
var workerUrl = new URL("./producer-worker.mjs", import.meta.url);
var implementation = hash(Buffer.concat([
  fs.readFileSync(workerUrl),
  fs.readFileSync(new URL("./runtime.mjs", import.meta.url)),
  fs.readFileSync(new URL("./common.mjs", import.meta.url)),
  ...["index.mjs", "contract.mjs", "producer.mjs", "publication.mjs", "hash-node.mjs", "../package.json"].map((name) => fs.readFileSync(new URL(name, import.meta.resolve("@zixcel/projection-contracts"))))
]));
var ProducerRegistry = class {
  #entries = /* @__PURE__ */ new Map();
  register({ id, kind, configuration = {} }) {
    token(id);
    check(["data", "scene"].includes(kind));
    check(this.#entries.size < 8, "ProjectionLimitExceeded");
    check(!this.#entries.has(id), "ProjectionIdentityConflict");
    canonical(configuration, 16384);
    const identity = { id, version: "0.10.0", contract: "projection/0.10.0", configuration: hash(canonical({ implementation, kind, configuration })) };
    const entry = Object.freeze({ identity: Object.freeze(identity), kind, configuration: clone(configuration) });
    this.#entries.set(id, entry);
    return clone(identity);
  }
  exact(identity) {
    const entry = this.#entries.get(identity?.id);
    check(entry && canonical(entry.identity) === canonical(identity), "ProjectionProducerUnavailable");
    return clone(entry);
  }
  // Unregister only the exact installed definition. Submitted jobs already own
  // an immutable copy; stale cleanup cannot remove a different configuration.
  unregister(identity) {
    this.exact(identity);
    this.#entries.delete(identity.id);
  }
  get artifactDigest() {
    return implementation;
  }
};

// implementation/run-job.mts
import { randomUUID } from "node:crypto";
import { canonical as canonical2, produce, validateSnapshot } from "@zixcel/projection-contracts";
import { check as check2, fail, shape as shape2, token as token2, errorCode as errorCode2 } from "./common.mjs";

// implementation/execution.mts
import { Worker } from "node:worker_threads";
import { errorCode, shape } from "./common.mjs";
var workerUrl2 = new URL("./producer-worker.mjs", import.meta.url);
function execute(entry, request, sources, signal, ms) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const worker = new Worker(workerUrl2, { workerData: { entry, request, sources }, resourceLimits: { maxOldGenerationSizeMb: 32, maxYoungGenerationSizeMb: 8, stackSizeMb: 2 } });
    const finish = async (failure, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", aborted);
      let failed = failure !== null;
      try {
        await worker.terminate();
      } catch (error2) {
        if (!failed) {
          failure = error2;
          failed = true;
        }
      }
      if (failed) reject(failure);
      else resolve(value);
    };
    const error = (code) => Object.assign(new Error(code), { code });
    const aborted = () => void finish(error(errorCode(signal.reason) === "ProjectionExecutionTimeout" ? "ProjectionExecutionTimeout" : "ProjectionCancelled"));
    const timer = setTimeout(() => void finish(error("ProjectionExecutionTimeout")), ms);
    worker.once("error", (e) => void finish(error(errorCode(e) === "ERR_WORKER_OUT_OF_MEMORY" ? "ProjectionLimitExceeded" : "ProjectionProducerFailed")));
    worker.once("message", (value) => {
      try {
        if (value && typeof value === "object" && "error" in value) {
          shape(value, ["error"]);
          return void finish(error(typeof value.error === "string" ? value.error : "ProjectionProducerFailed"));
        }
        shape(value, ["snapshot"]);
        void finish(null, value.snapshot);
      } catch {
        void finish(error("ProjectionProducerFailed"));
      }
    });
    worker.once("exit", () => {
      if (!settled) void finish(error("ProjectionProducerFailed"));
    });
    signal.addEventListener("abort", aborted, { once: true });
    if (signal.aborted) aborted();
  });
}

// implementation/holds.mts
async function cleanupHolds(reader, sets) {
  let failed = false, failure;
  for (const { holder, leases } of sets) {
    try {
      await reader.release(leases, holder);
    } catch (error) {
      if (!failed) {
        failure = error;
        failed = true;
      }
    }
  }
  if (failed) throw failure;
}

// implementation/run-job.mts
async function runJob(j, store, reader, limits) {
  const signal = j.controller.signal, now = Date.now(), p = store.repair(j.id), holder = randomUUID();
  if (p) check2(canonical2(p.request) === canonical2(j.request) && p.accessRef === j.accessRef, "ProjectionIdentityConflict");
  let ticket = p?.ticket;
  const expiresAt = p?.expiresAt ?? now + limits.repairMs, attempts = (p?.attempts ?? 0) + 1;
  if (expiresAt <= now || attempts > limits.attempts) {
    if (p) await cleanupHolds(reader, [{ holder: p.holder, leases: p.leases }, ...p.previous]);
    store.finish(j.id);
    fail("ProjectionRepairExpired");
  }
  const deadline = Math.min(now + limits.executionMs, expiresAt);
  const timeout = () => j.controller.abort(Object.assign(new Error("ProjectionExecutionTimeout"), { code: "ProjectionExecutionTimeout" }));
  let leases = [], previous = p ? [...p.previous, { holder: p.holder, leases: p.leases }] : [], saved = false, published = false, cleaned = false;
  const timer = setTimeout(timeout, Math.max(1, deadline - Date.now()));
  const running = () => {
    if (Date.now() >= deadline && !signal.aborted) timeout();
    check2(!signal.aborted, errorCode2(signal.reason) === "ProjectionExecutionTimeout" ? "ProjectionExecutionTimeout" : "ProjectionCancelled");
  };
  try {
    running();
    ticket ??= store.begin(j.request.key, { deadline });
    running();
    const base = { id: j.id, holder, previous, ticket, request: j.request, producer: j.entry.identity, accessRef: j.accessRef, expiresAt, attempts, failure: null, leases };
    store.pending(base, { deadline, previousHolder: p?.holder });
    saved = true;
    running();
    const result = await reader.acquireExact(j.request.sources, { accessRef: j.accessRef, holder, until: expiresAt, deadline, signal });
    shape2(result, ["sources", "leaseRefs"]);
    check2(Array.isArray(result.leaseRefs) && result.leaseRefs.length <= 8, "ProjectionLimitExceeded");
    result.leaseRefs.forEach(token2);
    leases = result.leaseRefs;
    store.pending({ ...base, leases }, { deadline });
    await cleanupHolds(reader, previous);
    previous = [];
    store.pending({ ...base, leases, previous }, { deadline });
    running();
    canonical2(result.sources, limits.inputBytes);
    running();
    const output = await execute(j.entry, j.request, result.sources, signal, Math.max(1, deadline - Date.now()));
    running();
    const snapshot = validateSnapshot(output);
    check2(canonical2(snapshot.lineage.sources) === canonical2(produce(j.request, result.sources).lineage.sources), "SourceRevisionMismatch");
    running();
    const receipt = store.publish(ticket, snapshot, j.id, { deadline });
    published = true;
    running();
    return { snapshot, receipt };
  } catch (error) {
    if (signal.aborted && errorCode2(signal.reason) === "ProjectionExecutionTimeout") error = signal.reason;
    if (saved) {
      check2(ticket, "ProjectionStoreCorrupt");
      const terminal = attempts >= limits.attempts || ["ProjectionCancelled", "ProjectionExecutionTimeout", "StaleProjectionPublication", "SourceNotRetained", "VisibilityDenied", "SourceRevisionMismatch", "SourceCorrupt"].includes(errorCode2(error) ?? "");
      if (terminal) {
        await cleanupHolds(reader, [{ holder, leases }, ...previous]);
        cleaned = true;
        store.finish(j.id);
        saved = false;
      } else store.pending({ id: j.id, holder, previous, ticket, request: j.request, producer: j.entry.identity, accessRef: j.accessRef, expiresAt, attempts, failure: errorCode2(error) ?? "ProjectionProducerFailed", leases });
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (!cleaned && (published || !saved)) await cleanupHolds(reader, [{ holder, leases }, ...previous]);
  }
}

// implementation/runtime.mts
import { ExactSourceReader } from "./exact-sources.mjs";
function validatedRequest(r) {
  return produce2(r, r.sources.map((source) => ({ source, items: [], relations: [], unresolved: [], truncated: false }))).lineage.request;
}
var ProjectionRuntime = class {
  #store;
  #registry;
  #reader;
  #limits;
  #active = /* @__PURE__ */ new Map();
  #queue = [];
  #closed = false;
  constructor({ store, registry, reader, limits = {} }) {
    check3(store && registry instanceof ProducerRegistry && typeof reader?.acquireExact === "function" && typeof reader.release === "function");
    this.#store = store;
    this.#registry = registry;
    this.#reader = reader;
    this.#limits = bounds(limits);
  }
  inspect() {
    return { active: this.#active.size, queued: this.#queue.length, closed: this.#closed, limits: this.#limits, store: this.#store.inspect() };
  }
  submit(input, { accessRef: rawAccessRef, signal = new AbortController().signal, id = randomUUID2() } = {}) {
    check3(!this.#closed, "ProjectionRuntimeClosed");
    const accessRef = token3(rawAccessRef);
    token3(id);
    const request = clone2(input);
    validatedRequest(request);
    const entry = this.#registry.exact(request.producer);
    check3(entry.kind === "data" || entry.configuration.key === request.key);
    if (this.#active.size >= this.#limits.concurrent && this.#queue.length >= this.#limits.queued) fail2("ProjectionQueueFull");
    check3(!this.#active.has(id) && !this.#queue.some((j) => j.id === id), "ProjectionIdentityConflict");
    const pending = this.#store.repair(id);
    if (pending) {
      check3(canonical3(pending.request) === canonical3(request) && pending.accessRef === accessRef, "ProjectionIdentityConflict");
    }
    return new Promise((resolve, reject) => {
      const job = { id, request, entry, accessRef, controller: new AbortController(), pending, signal, resolve, reject, abort: () => {
      } };
      job.abort = () => {
        job.controller.abort();
        const index = this.#queue.indexOf(job);
        if (index >= 0) {
          this.#queue.splice(index, 1);
          job.signal.removeEventListener("abort", job.abort);
          reject(Object.assign(new Error("ProjectionCancelled"), { code: "ProjectionCancelled" }));
        }
      };
      signal.addEventListener("abort", job.abort, { once: true });
      if (signal.aborted) {
        signal.removeEventListener("abort", job.abort);
        reject(Object.assign(new Error("ProjectionCancelled"), { code: "ProjectionCancelled" }));
        return;
      }
      this.#queue.push(job);
      this.#pump();
    });
  }
  retry(id, options = {}) {
    const r = this.#store.repair(token3(id));
    check3(r, "ProjectionRepairUnavailable");
    return this.submit(r.request, { ...options, accessRef: r.accessRef, id });
  }
  async expire(id) {
    check3(!this.#active.has(id) && !this.#queue.some((j) => j.id === id), "ProjectionStoreBusy");
    const r = this.#store.repair(token3(id));
    if (!r) return;
    await this.#store.withAttempt(id, async () => {
      const current = this.#store.repair(id);
      if (!current) return;
      await this.#cleanup([{ holder: current.holder, leases: current.leases }, ...current.previous]);
      this.#store.finish(id);
    });
  }
  #pump() {
    while (!this.#closed && this.#active.size < this.#limits.concurrent && this.#queue.length) {
      const j = this.#queue.shift();
      this.#active.set(j.id, j);
      const finished = () => {
        this.#active.delete(j.id);
        j.signal.removeEventListener("abort", j.abort);
        this.#pump();
      };
      j.done = Promise.resolve().then(() => this.#store.withAttempt(j.id, () => this.#run(j))).then((value) => {
        finished();
        j.resolve(value);
      }, (error) => {
        finished();
        j.reject(error);
      });
    }
  }
  #cleanup(sets) {
    return cleanupHolds(this.#reader, sets);
  }
  #run(j) {
    return runJob(j, this.#store, this.#reader, this.#limits);
  }
  recoverState({ key, revision = null }) {
    try {
      const snapshot = this.#store.read(token3(key));
      return snapshot ? recovery(snapshot, revision) : { kind: "RecoveryUnavailable", reason: "ProjectionUnavailable" };
    } catch (error) {
      return { kind: "RecoveryUnavailable", reason: errorCode3(error) ?? "ProjectionUnavailable" };
    }
  }
  async close() {
    this.#closed = true;
    for (const j of [...this.#queue]) j.abort();
    for (const j of this.#active.values()) j.controller.abort();
    await Promise.all([...this.#active.values()].map((j) => j.done));
  }
};
export {
  ExactSourceReader,
  ProducerRegistry,
  ProjectionRuntime
};
