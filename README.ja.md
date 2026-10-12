# Projectionのbounded実行と表示

[English](README.md)

登録したproducerをbounded Node workerで実行し、正確なowner sourceから読み取り専用snapshotを公開します。private storeとpublication fenceを持ち、製品の意味・権限・可視性・retentionは利用アプリが決めます。

| package | 責務 |
| --- | --- |
| projection-contracts | Data/Scene検証、正確なidentity、publication fence |
| projection-runtime | worker、private store、durable公開 |
| projection-client | snapshot採用、表示状態、古いaction拒否 |
| dom-renderer | bounded DOM描画と宣言済みinteraction |

現在の物理名を維持し、候補名への実移行は別の確認段階にします。[playground](playground/data-to-screen/README.ja.md)でproducerから表示、更新、拒否まで試せます。[責務と運用](docs/architecture-and-operations.ja.md)を参照してください。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm -r --include-workspace-root typecheck
pnpm -r --include-workspace-root test
pnpm test:consumer
pnpm playground:build
pnpm playground:serve
```

runtime storeにはLinux/WSL、既存flock/setpriv、private parent directoryが必要です。任意commandを実行するOS sandboxではありません。依存は正式registry版を宣言し、開発workspace linkとTGZの独立consumerを分けます。

公開はownerのpublish-npm.ymlで、review済みhash・consumer検証・OIDC provenanceを確認します。公開と実アプリ配備は別で、private管理repoや他組織secretを通常運用に要求しません。LICENSE/NOTICEを保持します。
