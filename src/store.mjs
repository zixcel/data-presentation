// Generated from canonical TypeScript; do not edit.

// implementation/store.mts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { bounds, check, fail, token, errorCode, shape } from "./common.mjs";
import { privateDirectory, privateFile } from "./private-files.mjs";
var helper = fileURLToPath(new URL("./store-process.mjs", import.meta.url));
var FileProjectionStore = class _FileProjectionStore {
  #directory;
  constructor(directory) {
    this.#directory = path.resolve(directory);
  }
  static create(directory, limits = {}) {
    check(process.platform === "linux", "ProjectionStoreUnsupported");
    privateDirectory(path.dirname(path.resolve(directory)));
    const store = new _FileProjectionStore(directory);
    fs.mkdirSync(store.#directory, { mode: 448 });
    const fd = fs.openSync(path.join(store.#directory, "lock"), "wx", 384);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    for (let n = 0; n < 16; n++) {
      const fd2 = fs.openSync(path.join(store.#directory, `attempt-${n}`), "wx", 384);
      fs.fsyncSync(fd2);
      fs.closeSync(fd2);
    }
    store.#call("create", { limits: bounds(limits) });
    return store;
  }
  #call(operation, input, { deadline = null } = {}) {
    check(deadline === null || Number.isSafeInteger(deadline), "InvalidProjection");
    const remaining = deadline === null ? 1e4 : deadline - Date.now();
    check(remaining > 0, "ProjectionExecutionTimeout");
    const lock = path.join(this.#directory, "lock");
    try {
      privateDirectory(this.#directory);
      privateFile(fs.lstatSync(lock));
    } catch (e) {
      if (errorCode(e) === "ENOENT") fail("ProjectionUnavailable");
      throw e;
    }
    const fd = fs.openSync(lock, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
      privateFile(fs.fstatSync(fd));
    } catch (error) {
      fs.closeSync(fd);
      throw error;
    }
    let result;
    const mode = ["read", "inspect", "repair", "begin"].includes(operation) ? "--shared" : "--exclusive";
    const waitSeconds = String(Math.min(250, remaining) / 1e3);
    try {
      result = spawnSync(
        "/usr/bin/setpriv",
        ["--pdeathsig", "SIGKILL", "--", "/usr/bin/flock", mode, "--timeout", waitSeconds, "--no-fork", "--conflict-exit-code", "73", "/proc/self/fd/3", process.execPath, helper, this.#directory, operation, String(process.pid)],
        { input: JSON.stringify(input), stdio: ["pipe", "pipe", "pipe", fd], maxBuffer: 13 * 1024 * 1024, timeout: Math.min(1e4, remaining), killSignal: "SIGKILL" }
      );
    } finally {
      fs.closeSync(fd);
    }
    if (result.status === 73) fail("ProjectionStoreBusy");
    if (errorCode(result.error) === "ETIMEDOUT" && deadline !== null) fail("ProjectionExecutionTimeout");
    if (result.error || result.status !== 0) fail("ProjectionUnavailable");
    let output;
    try {
      output = JSON.parse(result.stdout.toString());
    } catch {
      fail("ProjectionStoreCorrupt");
    }
    check(output !== null && typeof output === "object", "ProjectionStoreCorrupt");
    if ("error" in output) {
      check(typeof output.error === "string", "ProjectionStoreCorrupt");
      fail(output.error);
    }
    shape(output, ["value"]);
    return output.value;
  }
  inspect() {
    return this.#call("inspect", {});
  }
  // Hints only: readers validate the durable image under the existing lock.
  // Its mtime is touched only after publication/drop, never pending lease writes.
  // Neither this timestamp nor event delivery is a state/revision authority.
  watch(onChange) {
    let timer, closed = false;
    const notify = () => {
      if (closed || timer) return;
      timer = setTimeout(() => {
        timer = void 0;
        if (!closed) onChange();
      }, 20);
    };
    const watcher = fs.watch(this.#directory, (_event, name) => {
      if (name === null || String(name) === "lock") notify();
    });
    watcher.on("error", notify);
    return () => {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      watcher.close();
    };
  }
  async withAttempt(id, operation) {
    token(id);
    privateDirectory(this.#directory);
    let stripe = 0;
    for (const byte of Buffer.from(id)) stripe = (stripe * 31 + byte) % 16;
    let fd;
    try {
      fd = fs.openSync(path.join(this.#directory, `attempt-${stripe}`), fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    } catch (error) {
      if (errorCode(error) === "ENOENT") fail("ProjectionUnavailable");
      throw error;
    }
    try {
      privateFile(fs.fstatSync(fd));
      const result = spawnSync("/usr/bin/flock", ["--exclusive", "--nonblock", "--conflict-exit-code", "73", "3"], { stdio: ["ignore", "pipe", "pipe", fd], timeout: 1e3 });
      if (result.status === 73) fail("ProjectionStoreBusy");
      check(!result.error && result.status === 0, "ProjectionUnavailable");
      return await operation();
    } finally {
      fs.closeSync(fd);
    }
  }
  begin(key, options) {
    return this.#call("begin", { key: token(key) }, options);
  }
  read(key, revision = null) {
    return this.#call("read", { key: token(key), revision });
  }
  publish(ticket, snapshot, jobId, options) {
    return this.#call("publish", { ticket, snapshot, jobId: token(jobId) }, options);
  }
  pending(record, options = {}) {
    return this.#call("pending", { record, previousHolder: options.previousHolder ?? null }, options);
  }
  repair(id) {
    return this.#call("repair", { id: token(id) });
  }
  finish(id) {
    return this.#call("finish", { id: token(id) });
  }
  dropSnapshots(key) {
    return this.#call("drop", { key: token(key) });
  }
};
export {
  FileProjectionStore
};
