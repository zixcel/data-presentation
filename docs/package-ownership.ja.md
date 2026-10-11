# パッケージの保守正本

Projection runtime / contracts / client / DOM rendererの実装・型・テスト・配布設定は`zixcel/projection-runtime`を保守正本とする。npm名は`@zixcel`に統一する。package.jsonのrepository.urlと子パッケージのrepository.directoryは、このソース配置に一致させる。

Projectionは状態・通信契約・client・描画の依存グラフを一つのworkspaceで検証する。Structured Surfaceはデータ契約とHTML/Markdown adapterを一つのworkspaceで検証する。両workspaceは責務とrelease検証を分け、ソースの重複コピーは作らない。copyright・LICENSE・NOTICE・既存の移管履歴は保持する。

新名は0.10.0から公開する。既存の`@hathq`配布物は歴史的な配布物として保持し、新名の公式配布物を照合してから利用側の依存・import・lockfileを切り替える。未公開の新名を通常の利用側CIに指定しない。旧名の非推奨案内は後継の公開後に行う。

反映前にfrozen install・既存テスト・型検証と、7件の実TGZによる独立Node/NodeNext/browser consumerを検証する。配布時の内部依存もregistry版指定とし、workspace内だけで成立するfile/link参照を配布しない。Trusted Publisherは各新名にこの正本リポジトリの公開workflowを登録する。
