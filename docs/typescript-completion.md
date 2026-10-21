# Strict TypeScript source and generated distributions

All first-party JavaScript runtime paths are compiler outputs of tracked TypeScript. The exact generated-file inventory is `typescript-migration.json`; its pending list is empty. Runtime imports remain JavaScript so independent Node/browser consumers need no compiler. Source-history bundles are historical preservation, not executable implementation inputs.

Owner CI builds with strict types and `noEmitOnError`, checks the emitted files, runs runtime and installed-archive consumers, and executes the actual browser/playground/WebGL acceptance. The migration guard refuses unclassified JavaScript, generated files without a canonical TypeScript source, stale output inventories, untyped source escapes and a new deferred-JavaScript list. Browser startup data and browser acceptance are themselves typed; no handwritten JavaScript fixture is embedded in the driver.

## Resource ownership

The rendering controller holds one view's mutable state. Its public interface exposes only presentation operations, not the mutable controller or GPU resources. Camera, projection reconciliation, input, frame scheduling and lifecycle cleanup have separate modules. Existing bounds on objects, relations, GPU instances, pixels, labels, recent observations and remembered poses remain in force.

Invalid initial input is refused before DOM/GPU acquisition. Partial setup cleanup attempts every acquired resource and preserves cleanup errors. Parked views do not resume their render loop on page restoration. Host activity remains an opaque owner input and is no longer serialized by the generic renderer; adapters may supply an optional `close` hook for their own view resources. Surface leases prevent stale releases from parking a newer view.

Delivery retains the original HTTP request for Node-to-Crowsi authentication. Crowsi owns framing, sessions, ACK and recovery. Delivery owns HTTP intake, trusted assets and owner observations. Disconnect and HTTP observer deadlines do not fabricate physical cancellation; late original commit evidence remains observable. Shutdown closes the owning site before draining work that depends on that close. Diagnostic callbacks cannot change that branch through synchronous throws or rejected promises. Bounded response admission rejects serialization hooks and sparse/oversized arrays before encoding.

Local checks run in finite memory, task, CPU and time units without swap. Browser/GPU acceptance runs on the owner CI runner, not the local workstation. Skipped execution is never counted as a successful test.

## Acceptance versus publication

Version 0.10.4 was independently accepted from the public registry at source `82d579717f9c76367456db35eb761119738f0145`. Later migration work does not alter those immutable archives. Development completion and any later version's tag, prepared bytes, npm stage and formal publication each require their own recorded evidence.
