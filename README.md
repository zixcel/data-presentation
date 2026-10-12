# @zixcel/projection-runtime

[日本語](README.ja.md)

Execute explicitly registered projection producers in bounded Node.js workers and
publish disposable read-only snapshots with durable fencing and exact owner leases.
The runtime never chooses a latest source, loads request-supplied code or owns
application authorization. Owner adapters decide visibility and retention.

## Package responsibilities

| Package | Owns | Does not own |
| --- | --- | --- |
| projection-contracts | Validated Data/Scene snapshots, exact identities and publication fences | Product authorization, durable storage or arbitrary producer code |
| projection-runtime | Registered bounded workers and private durable snapshot publication | Product meaning or source visibility decisions |
| projection-client | Exact snapshot adoption and presentation state | Canonical product state or permission grants |
| dom-renderer | Bounded DOM rendering and declared interactions | Remote scripts, product commands or account credentials |

The current physical names remain unchanged while their migration candidates are reviewed. [Data to screen playground](playground/data-to-screen/README.md) uses public exports and shows the stages in one runnable example. [Architecture and operations](docs/architecture-and-operations.md) explains source, distribution and rollback ownership.

## Install and use

```sh
npm install @zixcel/projection-runtime@0.10.2
```

```ts
import { ProducerRegistry, ProjectionRuntime, ExactSourceReader } from '@zixcel/projection-runtime'
import { FileProjectionStore } from '@zixcel/projection-runtime/store'

const registry = new ProducerRegistry()
const producer = registry.register({ id: 'review', kind: 'data' })
// Provision this existing parent as mode 0700 before creating the store once.
const store = FileProjectionStore.create('/private/application/projections')
// adapters is a Map of owner IDs to bounded acquire/read/release/releaseHolder APIs.
const reader = new ExactSourceReader(adapters)
const runtime = new ProjectionRuntime({ store, registry, reader })
try {
  const { snapshot } = await runtime.submit({
    key: 'review', producer, sources: exactOwnerReferences,
    focus: 'selected-resources', purpose: 'review', visibilityRef: acceptedVisibility,
    limits: {}
  }, { accessRef: acceptedOwnerAccess })
  console.log(snapshot.revision)
} finally {
  await runtime.close()
}
```

The application supplies `adapters`, `exactOwnerReferences`, `acceptedVisibility`
and `acceptedOwnerAccess`; these are explicit authorization bindings, not defaults.
A producer must be registered before requests can reference its returned identity.

## Boundaries and operating environment

The file store requires Linux/WSL, Node.js 22 or newer, `/usr/bin/flock` and
`/usr/bin/setpriv`. It rejects non-private directories, foreign ownership, symbolic
links and hard-linked state files. It runs local transaction helpers and built-in
producer workers; it does not execute arbitrary owner commands. It does not provide
an OS sandbox against another process running as the same user.

Store hints are wakeups, not revision authorities. Read/inspect never initializes
state. Repair leases preserve exact source identity, and cancelled or timed-out
work must drain before protection is released. Owner IO must honor its deadline
and AbortSignal, including independently bounded lost-response cleanup.

`@zixcel/projection-contracts` owns wire validation and deterministic sealing;
projection-client owns disposable browser adoption; dom-renderer owns presentation.
This package owns execution/publication and no product-specific meaning.

## Development

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm -r --include-workspace-root typecheck
pnpm -r --include-workspace-root test
pnpm audit --audit-level=low
```

Production manifests use registry versions. Numeric workspace linking is only a
local development convenience. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Package ownership and scope migration

[保守正本と移行条件](docs/package-ownership.ja.md)。The maintained source and npm scope are owned by Zixcel. Current `@zixcel` dependencies resolve through the official npm registry. Historical `@hathq` releases remain provenance history; new versions are adopted only after their official artifacts are verified.

## Release provenance

Starting with 0.10.1, releases use GitHub Actions OIDC trusted publishing from `zixcel/projection-runtime` (`publish-npm.yml`), without a stored npm publishing token. The workflow verifies reviewed archive hashes and requires npm provenance metadata. Check the published version on npm and verify registry signatures and provenance with `npm audit signatures` in an installed consumer project. Package runtime behavior and API contracts are unchanged by this release.
