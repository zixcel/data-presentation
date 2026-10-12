# @zixcel/projection-client

[日本語](README.ja.md)

Adopt a validated display snapshot and keep updates tied to the correct revision.

## What you can do

- Reject stale or mismatched snapshots.
- Track navigation and interaction state across accepted updates.

## Current scope

The host supplies transport and trusted rendering. The client does not invent actions or canonical application state.

Use the version declared by this source and verify the official registry artifact/provenance before adopting a new release.

## Getting started

Dependencies use exact public npm versions. The repository workspace links the current source for development; owner CI separately installs the packed archives outside this checkout. No private registry or excluded local archive is required.

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
