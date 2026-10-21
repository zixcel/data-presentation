# @zixcel/view-delivery

Serve reviewed view snapshots and trusted release assets from a configured display host.

## What you can do

- Deliver an initial view with exact source references.
- Connect declared state updates and cancellation.

## Current scope

The current host is owner-local. Public HTTPS, authentication and placement require separate deployment validation.

Package distribution is not activated by this documentation. Use the checked-in source and the declared dependency versions; published availability must be verified separately.

## Getting started

The source uses registry version declarations for the generic Zixcel and Crowsi dependencies. Initial publication is pending; the migration verifier installs reviewed archives together in an isolated consumer. Product consumers retain their current released names until the new registry artifacts are verified.

Use the package manager matching the checked-in lockfile and the Node.js version declared in `package.json` or the development configuration. Run from this repository:

```sh
pnpm install --frozen-lockfile
pnpm test
```

## Documentation and source

[Usage guide](docs/getting-started.md)

[Implementation and public interfaces](src) · [Verification cases](test) · [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md) · [License](LICENSE) · [Attribution notices](NOTICE)

## Product boundary

The host requires an explicit owner, title, wire contract and allowed outcome
owner list. Cookie and request-header names may be supplied by the product;
defaults are generic. The Hatter browser UI remains in the product repository.
This workspace owns only the host and delivery contracts.

## Release provenance

Starting with 0.10.1, releases use GitHub Actions OIDC trusted publishing from `zixcel/view-delivery` (`publish-npm.yml`), without a stored npm publishing token. The workflow verifies reviewed archive hashes and requires npm provenance metadata. Check the published version on npm and verify registry signatures and provenance with `npm audit signatures` in an installed consumer project. Package runtime behavior and API contracts are unchanged by this release.

## Node.js security baseline

Use a supported Node.js security release for Node-based build, delivery and consumer processes: at least 22.23.4, 24.22.1 or 26.12.1. The renderer runs in the browser and does not bundle Node. Updating an npm library does not update the caller's Node executable. The October 21, 2026 security fixes include TLS, DNS, HTTP and Brotli handling; operator-managed runtimes must be updated independently. GitHub Actions pins select the shell/build runtime, not the GitHub-managed runtime of JavaScript Actions.

Official advisory: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
