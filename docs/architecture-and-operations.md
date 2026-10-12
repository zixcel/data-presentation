# Projection package architecture and operations

[日本語](architecture-and-operations.ja.md)

Use this feature workspace when explicitly selected source data must become a bounded, exact display snapshot. The root owns worker/store execution, contracts owns snapshot validation/sealing, client owns presentation adoption and renderer owns installed DOM primitives. A view does not own or change product authority.

Development uses the declared pnpm workspace. Public imports, package entrypoints and versioned registry dependencies are the same interfaces used by the independent archive consumer. Keep storage and worker processes on the documented Linux/WSL platform; browser consumers use their browser-safe package entrypoints. A browser does not execute the worker or access the private store.

## Owner validation and release

Run frozen install, workspace type checks/tests, playground build/browser tests and test:consumer. The latter packs all four candidates, installs them outside the workspace with empty npm configuration and executes the worker/store example plus client rejection cases. Public registry dependencies resolve independently of private coordination.

The existing publish-npm.yml workflow keeps its Trusted Publisher binding. It verifies reviewed archive hashes, source tests and the packed consumer before OIDC publication. Multiple package publication is not atomic; verify already published integrities and resume only missing versions. Official archive hashes and registry attestations are independent of source test success. Package renames/repository transfers require their new source/trust mappings before publication.

## Playground and application operations

playground:build generates two synthetic snapshots with the real bounded worker/store implementation and bundles the public client/renderer. playground:serve serves only generated assets on loopback and reuses Crowsi Host/Origin/Fetch-Site policy. No account, credential, provider, arbitrary code or persistent product DB is contacted. An application that needs real mutations supplies its own reviewed operation/authority binding.

Deploying an application's UI is owned by that application. Pin reviewed package versions and source references, then build/preview/verify/promote through its own provider workflow. Do not treat this package's npm publication as deployment. Roll back the application artifact/package lock independently. Cached snapshots are derived state; rebuild only from exact retained owner source, not an implicit latest revision.

No ordinary update requires CoelaRelease, another organization's private checkout, central secret or unrelated release. Product-specific visibility, retention and producer meaning remain with the application. Report unknown or unsupported source/OS/authority states explicitly.
