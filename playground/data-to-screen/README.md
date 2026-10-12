# Data to screen playground

[日本語](README.ja.md)

Follow synthetic data through a registered Node producer, private temporary snapshot store, exact browser adoption and public DOM rendering. All imports use package exports; the demo never reads product state or connects an account.

From the repository root:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm playground:build
pnpm playground:serve
```

Open http://127.0.0.1:4173. Adopt the newer snapshot, then try a stale action, mismatched delivery and corrupt snapshot. Rejected operations retain the accepted state. An action descriptor does not grant authority or execute a product command.

The browser contains two prebuilt synthetic snapshots and makes no API requests. The Node build uses the actual bounded producer/store implementation and removes its generated temporary state. Linux/WSL and the documented flock/setpriv requirements apply. This demonstration does not prove an OS sandbox or a real backend's authorization.

Owner CI also installs packed packages outside the workspace and runs the public example. Browser tests verify the same controls at desktop and narrow viewport sizes. Each package owns its runtime requirements; the repository does not need private CoelaRelease access.
