---
name: Soonish プロジェクト現状
description: v1完了・通知ロジック改善済み・App Store申請準備済み。Apple Developer登録メール待ち。
type: project
originSessionId: 0fd60415-06ad-44ce-a76c-43bfa7ec9572
---
v1開発完了。Apple Developer登録申請中（メール待ち）。

**Why:** Team IDが確定しないとApp Group・実機テスト・App Store申請が進められない。

**How to apply:** 次の会話ではTeam ID確定後の実機テスト・App Store申請手続きが主なタスクになる。

## 完了済み
- スケジュール管理UI・通知ロジック・ウィジェット・多言語対応
- アプリアイコン（`assets/icon.png`、`scripts/gen-icon.mjs` で再生成可能）
- プライバシーポリシー: https://ggtnk0909-del.github.io/Soonish/privacy.html
- App Storeメタデータ: `docs/appstore-metadata.md`
- スクリーンショット: `docs/screenshots/` (iPhone 17 Pro Max)
- ユニットテスト: `__tests__/` (28テスト全通過)

## 通知ロジック改善（2026-04-25）
- **変更前**: `WEEKLY` トリガー → 毎週同じ時刻に固定（fuzzは保存時のみ1回）
- **変更後**: `DATE` トリガー → 8週先まで日付ごとに個別fuzzを生成して登録（最大60件）
- 起動時に残り14件未満なら自動補充（`app/index.tsx` の `useEffect`）
- **制約注記**: `src/i18n.ts` の `alarm.refreshHint` と `docs/appstore-metadata.md` に「数週間に1度開く必要あり」を追記
- **実機での動作確認はまだ**（シミュレータでは通知は鳴らない）

## Team ID確定後のタスク
1. `app.json` の `appleTeamId: "XXXXXXXXXX"` を実際の値に変更
2. Xcode で App Group capability を追加（アプリ本体・ウィジェット拡張）
3. `expo prebuild` → Xcode ビルド → 実機インストール
4. 実機で通知（DATE トリガー・fuzz変動）・ウィジェット動作確認
5. `eas build` または Xcode Archive でビルドをApp Store Connectにアップロード
6. App Store Connectでメタデータ入力・審査提出
