# @zixcel/projection-client

Adopt a validated display snapshot and keep updates tied to the correct revision.

## What you can do

- Reject stale or mismatched snapshots.
- Track navigation and interaction state across accepted updates.

## Current scope

The host supplies transport and trusted rendering. The client does not invent actions or canonical application state.

Package distribution is not activated by this documentation. Use the checked-in source and the declared dependency versions; published availability must be verified separately.

## Getting started

The manifest currently requires locally supplied package archives: `@zixcel/projection-contracts`. These archives are excluded from Git. Obtain the exact approved dependency artifacts before installing; a fresh clone alone is not sufficient. Registry distribution remains pending.

Use the package manager matching the checked-in lockfile and the Node.js version declared in `package.json` or the development configuration. Run from this repository:

```sh
pnpm install --frozen-lockfile
pnpm test
```

## Documentation and source

[Usage guide](docs/getting-started.md)

[Implementation and public interfaces](src) · [Verification cases](test) · [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md) · [License](LICENSE) · [Attribution notices](NOTICE)

## Release provenance

Starting with 0.10.1, releases use GitHub Actions OIDC trusted publishing from `zixcel/projection-runtime` (`publish-npm.yml`), without a stored npm publishing token. The workflow verifies reviewed archive hashes and requires npm provenance metadata. Check the published version on npm and verify registry signatures and provenance with `npm audit signatures` in an installed consumer project. Package runtime behavior and API contracts are unchanged by this release.
