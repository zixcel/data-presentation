# Typed projection execution and source lifetime

First-party runtime code is canonical TypeScript under `implementation/`.
Registry, queue/lifecycle orchestration, worker execution, job attempts and hold
cleanup have separate responsibilities. Public ESM paths and declarations are
generated; consumers do not need TypeScript or esbuild. Development/build tests
use the owner CI's Node 24 toolchain. Installed runtime support is unchanged.

The build retains the existing runtime module paths and bundles internal helpers
into those files. It checks that emitted imports do not introduce an uncovered
helper. The producer fingerprint continues to cover the closed worker/runtime,
common validation and projection-contract implementation bytes. Source adapters
remain explicit caller-owned readers; this does not grant provider authority,
load request-selected code or create another canonical data store.

A single execution deadline still covers acquisition, production and publication.
Cancellation drains actual owner IO and awaits worker termination. Worker V8
limits remain 32 MiB old generation, 8 MiB young generation and 2 MiB stack.
Release methods must remain independently bounded and idempotent as required by
the source-owner contract; a library cannot safely abandon accepted lease IO.
These per-instance limits are not a same-user sandbox or a global host cap.

Any thrown release value is a failure, including null, undefined, false, zero and
an empty string. Cleanup attempts every selected owner/holder and retains repair
metadata when expiration cleanup fails. A store adapter that throws before
returning its Promise cannot strand an active slot or queued job. Tests exercise
these conditions through the public runtime and a real private temporary file
store, plus an explicitly synthetic broken-adapter case.

The two existing store implementation files and remaining tests/browser code are
still listed and hash-pinned in the migration inventory until their own TS stage.
This source acceptance does not publish a package, change storage format, alter
permissions or validate a live provider account.
