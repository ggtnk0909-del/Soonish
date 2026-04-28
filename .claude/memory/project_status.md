---
name: Soonish プロジェクト現状
description: v1完了・実機ビルド準備中。macOS/Xcodeアップデート待ち。
type: project
originSessionId: e6c621fe-1c11-48c6-af70-ebda70724643
---
v1開発完了。Apple Developer登録完了（2026-04-29）。Team ID: UC35Y89335。Apple ID: hide.tnk.tnk@gmail.com。Mac は Intel 製。

**Why:** Team IDが確定しないとApp Group・実機テスト・App Store申請が進められなかった。

**How to apply:** macOS・Xcode更新完了後、Xcodeで再ビルド→実機インストールが次のステップ。

## 完了済み
- スケジュール管理UI・通知ロジック・ウィジェット・多言語対応
- アプリアイコン（`assets/icon.png`、`scripts/gen-icon.mjs` で再生成可能）
- プライバシーポリシー: https://ggtnk0909-del.github.io/Soonish/privacy.html
- App Storeメタデータ: `docs/appstore-metadata.md`
- スクリーンショット: `docs/screenshots/` (iPhone 17 Pro Max)
- ユニットテスト: `__tests__/` (28テスト全通過)
- Team ID設定（UC35Y89335）・expo prebuild 完了
- `plugins/withSwiftPodSettings.js` でビルドエラー対策済み

## 通知ロジック改善（2026-04-25）
- **変更前**: `WEEKLY` トリガー → 毎週同じ時刻に固定（fuzzは保存時のみ1回）
- **変更後**: `DATE` トリガー → 8週先まで日付ごとに個別fuzzを生成して登録（最大60件）
- 起動時に残り14件未満なら自動補充（`app/index.tsx` の `useEffect`）
- **実機での動作確認はまだ**（シミュレータでは通知は鳴らない）

## 残タスク
1. ~~`app.json` の `appleTeamId` を実際の値に変更~~ 完了（UC35Y89335）
2. ~~`expo prebuild`~~ 完了
3. **macOS アップデート → Xcode 26.4.1（Universal）インストール** ← 現在ここ
4. Xcode で App Group capability を追加（アプリ本体・ウィジェット拡張）
5. Xcode で再ビルド → 実機インストール・動作確認
6. 実機で通知（DATE トリガー・fuzz変動）・ウィジェット動作確認
7. App Store Connectでメタデータ入力・審査提出

## ビルド関連メモ
- Mac: Intel製 → Xcode 26.4.1 Universal 版をダウンロード
- iPhone: iOS 26.4.2、iPhone16,5（iPhone 16 Pro）
- Xcode 26.2 では iOS 26.4.2 実機に DDI をマウントできず → Xcode 26.4.1 が必要
- Swift 6並行性エラー対策: `plugins/withSwiftPodSettings.js`
  - `SWIFT_VERSION=5.0` / `SWIFT_STRICT_CONCURRENCY=minimal` / `SWIFT_ENABLE_EXPLICIT_MODULES=NO` / `SWIFT_PRECOMPILE_BRIDGING_HEADER=NO` を注入
- `expo prebuild` 実行後、Podfileに上記設定が自動注入される
- Xcodeでビルドする際は必ず `ios/Soonish.xcworkspace` を開くこと（.xcodeproj ではない）
