# Projection snapshotの検証

[English](README.md)

選択済みowner-visible source revisionからboundedなData/Sceneを構築・検証します。lineage/publication fenceを保持し、製品の意味・権限は持ちません。

browser-safe検証は@zixcel/projection-contracts/clientです。Node入口のproduce/sceneとin-memory ProjectionSlotはsnapshot構築/公開を扱い、再起動を越えるdurabilityはroot runtime/storeが担当します。

依存は正式npm版です。rootの[playground](../../playground/data-to-screen/README.ja.md)と[運用](../../docs/architecture-and-operations.ja.md)で公開APIの利用と独立consumerを確認します。型・schema・検証の保証と、製品authorityは区別します。LICENSE/NOTICEを保持します。
