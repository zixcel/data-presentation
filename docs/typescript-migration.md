# TypeScript migration

TypeScript is the canonical first-party language for runtime, tools, tests and examples. Generated JavaScript and third-party artifacts are classified separately. The exact pending inventory lives in `typescript-migration.json`; it is a temporary migration backlog, not an approved final exception. Owner issue #32 remains open until that inventory is empty.

The view-delivery contract, projection client and independent archive verifier are migrated. The projection client separates retained state/adoption from render-plan derivation. `packages/view-contracts/implementation/*.mts` generates the existing `src` import paths and declarations. CI strictly checks the implementation and tests, regenerates tracked output and refuses a dirty result. There is no separate manually maintained declaration contract. Input decoding starts with unknown data; no any/no-check escapes are introduced.

Existing runtime tests and installed-package/browser CI remain mandatory. Remaining runtime modules, browser helpers, tests and examples must be migrated in dependency order. No package version/publication or authorization change is part of this first stage.
