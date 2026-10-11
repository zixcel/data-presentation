# @hathq/projection-contracts

Share a precise contract for view snapshots, revisions and interactions between a producer and a renderer.

## What you can do

- Validate a bounded view snapshot.
- Keep action references tied to the accepted source revision.

## Current scope

The producer owns application meaning and authority; these contracts describe display data and interaction references.

Package distribution is not activated by this documentation. Use the checked-in source and the declared dependency versions; published availability must be verified separately.

## Getting started

The manifest currently requires locally supplied package archives: `@zixcel/interaction`. These archives are excluded from Git. Obtain the exact approved dependency artifacts before installing; a fresh clone alone is not sufficient. Registry distribution remains pending.

Use the package manager matching the checked-in lockfile and the Node.js version declared in `engines` in `package.json`. Run from this repository:

```sh
pnpm install --frozen-lockfile
pnpm test
```

## Documentation and source

[Interface reference](docs/interface-reference.md)

[Usage guide](docs/getting-started.md)

[Implementation and public interfaces](src) · [Verification cases](test) · [Contributing](CONTRIBUTING.md) · [Security reporting](SECURITY.md) · [License](LICENSE) · [Attribution notices](NOTICE)
