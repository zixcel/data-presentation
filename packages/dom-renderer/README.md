# @zixcel/dom-renderer

[日本語](README.ja.md)

Render a validated display plan into native DOM elements with controlled interactions.

## What you can do

- Create bounded, accessible display structures.
- Bind actions to exact declared handles.

## Current scope

Untrusted content is rendered as data. Arbitrary HTML, scripts and remote renderer definitions are not accepted.

Use the version declared by this source and verify the official registry artifact/provenance before adopting a new release.

## Getting started

Dependencies use exact public npm versions. The repository workspace links the current source for development; owner CI separately installs the packed archives outside this checkout. No private registry or excluded local archive is required.

Use the package manager matching the checked-in lockfile and the Node.js version declared in `package.json` or the development configuration. Run from this repository:

```sh
pnpm install --frozen-lockfile
pnpm test
```

## Documentation and source

[Interface reference](docs/interface-reference.md)

[Usage guide](docs/getting-started.md)

[Implementation and public interfaces](src) · [Verification cases](test) · [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md) · [License](LICENSE) · [Attribution notices](NOTICE)

## Release provenance

Current releases use GitHub Actions OIDC trusted publishing from `zixcel/data-presentation` (`publish-npm.yml`), without a stored npm publishing token. The workflow verifies reviewed archive hashes and requires npm provenance metadata. Check the published version on npm and verify registry signatures and provenance with `npm audit signatures` in an installed consumer project. Package runtime behavior and API contracts are unchanged by this release.

## Node.js security baseline

Use a supported Node.js security release for Node-based build, delivery and consumer processes: at least 22.23.4, 24.22.1 or 26.12.1. The renderer runs in the browser and does not bundle Node. Updating an npm library does not update the caller's Node executable. The October 21, 2026 security fixes include TLS, DNS, HTTP and Brotli handling; operator-managed runtimes must be updated independently. GitHub Actions pins select the shell/build runtime, not the GitHub-managed runtime of JavaScript Actions.

Official advisory: https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
# Build-time shader compaction

Browser bundles may opt in to `@zixcel/dom-renderer/tooling/compact-shaders`, an
esbuild plugin that removes whitespace from the reviewed Three.js 0.186.1 shader
chunks while checking their token sequence and preprocessor boundaries. It refuses
any other upstream file until reviewed. It does not modify the installed source,
runtime API, graphics features or Three.js license notices.
