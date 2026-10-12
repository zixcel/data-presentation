# Projection client

[English](README.md)

正確な表示snapshotを採用し、revisionに束縛した表示状態とaction handleを管理します。古いsnapshot/action、hydrate不一致を拒否し、canonical製品状態や権限は作りません。

依存は正式npmのprojection-contractsです。開発時のworkspace linkとは別に、owner CIがTGZをcheckout外へ導入します。Git外のlocal archiveやprivate registryは不要です。

rootの[playground](../../playground/data-to-screen/README.ja.md)と[責務・運用](../../docs/architecture-and-operations.ja.md)を使って更新採用/拒否を確認してください。公開importは@zixcel/projection-client、transportと製品認可は利用側が明示します。LICENSE/NOTICEを保持します。
