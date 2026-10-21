# Presentation packages 0.10.4

This coordinated patch release delivers the accepted canonical TypeScript contracts,
client lifecycle, producer execution, private file store and archive/tool changes.
Existing public ESM paths, canonical wire format, bounded queues, worker budgets,
store format, atomic publication and upstream licensing remain supported.

Safety corrections include rejection of array serialization hooks and disabled
budgets, bounded cycle-safe traversal, retention of repairs on falsy cleanup errors,
queue drain after synchronous adapter errors, and complete retained-image validation.
A valid digest cannot bypass schema, collection, receipt or retention validation.

All six owner packages use 0.10.4 so independent archive consumers exercise one
explicit dependency graph. External runtime dependencies are unchanged. Publish
contracts before dependent clients, delivery contracts before delivery, and verify
each registry archive against the exact owner CI archive before consumer adoption.
Independent package tags prepare concurrently, while publication is serialized per
package identity. This avoids the repository-wide pending-run replacement that
otherwise drops unrelated package tags during Environment review.
Registry identity and settings remain owner-local; no shared execution is added.

TypeScript migration is still in progress under issue #32: DOM rendering and delivery
server/browser regressions remain in the tracked inventory. This release does not
claim that the complete migration, production deployment or live providers are accepted.
