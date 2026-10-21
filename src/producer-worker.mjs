// Generated from canonical TypeScript; do not edit.

// implementation/producer-worker.mts
import { parentPort, workerData } from "node:worker_threads";
import { produce, scene } from "@zixcel/projection-contracts";
import { check, errorCode, shape } from "./common.mjs";
check(parentPort, "ProjectionProducerFailed");
try {
  const input = workerData;
  shape(input, ["entry", "request", "sources"]);
  shape(input.entry, ["identity", "kind", "configuration"]);
  const request = input.request, sources = input.sources;
  const ceiling = request.limits.snapshotBytes ?? 524288;
  for (const source of sources) for (const item of source.items) {
    if (item.visibility === "visible" && Buffer.byteLength(JSON.stringify(item.value)) > ceiling) throw Object.assign(new Error("ProjectionLimitExceeded"), { code: "ProjectionLimitExceeded" });
  }
  const data = produce(request, sources);
  const snapshot = input.entry.kind === "scene" ? scene(data, input.entry.configuration) : data;
  parentPort.postMessage({ snapshot });
} catch (error) {
  parentPort.postMessage({ error: errorCode(error) ?? "ProjectionProducerFailed" });
}
parentPort.close();
