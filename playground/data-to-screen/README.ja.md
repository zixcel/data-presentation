# データから画面へのplayground

[English](README.md)

擬似dataを、登録済みNode producer、一時的なprivate snapshot store、browserの正確な採用、公開DOM APIの順に追います。packageの公開exportsだけを使い、製品dataや実accountには接続しません。

repo rootから実行します。

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm playground:build
pnpm playground:serve
```

http://127.0.0.1:4173 を開き、更新、古いaction、不一致の配信、改変snapshotを試してください。拒否時は採用済み状態を保持します。action記述は権限を与えず、製品commandも実行しません。

browserは事前生成した2つのsnapshotを使い、API requestを行いません。Node buildは実装済みproducer/storeを使い、作成した一時dataだけを片付けます。Linux/WSLと既存flock/setpriv要件が必要です。OS sandboxや実backend認可の受入を意味しません。

owner CIはpackをworkspace外に導入し同じ公開例を実行します。browser testはdesktop/狭い画面の操作を検証します。各packageの要件を保持し、private CoelaReleaseに依存しません。
