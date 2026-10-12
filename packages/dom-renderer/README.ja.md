# DOM renderer

[English](README.md)

検証済み表示planを導入済みDOM部品で描画します。外部値はdataとして扱い、任意HTML/script/remote rendererを採用しません。宣言済みaction handleを使い、製品commandやcredentialを所有しません。

依存は正式npm版です。開発workspaceとTGZ consumerを別に検証し、Git外のarchive/private registryを要求しません。公開importは@zixcel/dom-renderer、stylesheet入口は/styleです。

[playground](../../playground/data-to-screen/README.ja.md)で公開valueViewによる描画を試し、既存browser testでworld/interactionの境界を確認できます。[責務と運用](../../docs/architecture-and-operations.ja.md)、LICENSE/NOTICEを参照してください。
