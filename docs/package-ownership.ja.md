# パッケージの保守正本

汎用Projection・配信機能の正本は `zixcel/data-presentation` です。npm名と現行の配置は各 `package.json`、公開対象と手順は `.github/registry-release.json` と公開workflowで定義します。

| 配置 | 公開パッケージ | 責務 |
| --- | --- | --- |
| ルート | @zixcel/projection-runtime | 制限付きproducer実行・snapshotの永続化 |
| packages/projection-contracts | @zixcel/projection-contracts | 汎用の状態・入力契約 |
| packages/projection-client | @zixcel/projection-client | 状態の採用・RenderPlan生成 |
| packages/dom-renderer | @zixcel/dom-renderer | 汎用DOM描画 |
| packages/view-contracts | @zixcel/view-delivery-contracts | 文書配信・受付の汎用契約 |
| packages/view-server | @zixcel/view-delivery | 制限付きHTTP配信・owner結果の通知 |

`hathq/delivery-server` は現役のHatter用アダプターです。サーバーとwire契約はこの汎用基盤へ委譲し、Hatter固有のowner許可・表示・画面操作を保持します。`@hathq/delivery-*` を一括して旧版扱いしたり、汎用パッケージへ機械的に置換したりしません。

`zixcel/document-processing` は文書構造とHTML/Markdownアダプターを担当します。Projection・配信とは責務とrelease検証を分け、実装を重複コピーしません。著作権・LICENSE・NOTICEと固定SHAの移管来歴を保持します。

内部依存も公開時はregistry版を指定します。workspaceのlinkで試験が通ったことだけで公開済みとは扱いません。独立した実TGZ consumer・型・ブラウザー検証を行い、公開後の配布物・来歴を照合してから利用側の固定版とlockfileを更新します。版番号・ファイル数は固定せず、現行manifestと配布物から取得します。
