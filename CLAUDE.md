# Soonish — プロジェクト概要

## 目的

「出発時刻にランダム性を持たせた通知」で、毎朝ギリギリの時間設定による疲弊を防ぐ iOS アプリ。

**コンセプトの変遷:**
- 当初: ウィジェットに「少し先の時刻」を表示してユーザーを騙す設計
- 変更理由: iOSのロック画面は時刻を消せないため、ずらした時刻と本物が並んで見えて効果が薄い
- 現行: 「家を出る時刻」を登録し、毎日ランダムにずれた時刻でローカル通知を鳴らす
  - 例: 7:30出発 / 20分前通知 / ±5分 → ある日は7:06、別の日は7:14に通知
  - 慣れを防ぎ、時間的余裕が生まれるという仮説。リリース後のフィードバックで検証予定。

## 技術スタック

- Expo (React Native) + expo-router + TypeScript
- iOS ウィジェット: SwiftUI / WidgetKit
- カスタム Native Module: Expo Modules Core
- App Group: `group.com.hidet.soonish` で UserDefaults を共有
- 多言語対応: expo-localization + i18n-js（日本語・英語）
- 通知: expo-notifications（ローカル通知、曜日指定weeklyトリガー）
- テスト: Jest + ts-jest

## 主要ファイル

| パス | 役割 |
|------|------|
| `app/index.tsx` | スケジュール一覧画面（複数スケジュール管理・追加・編集・削除） |
| `app/peek.tsx` | 「本当の時刻」を3秒だけ表示するピーク画面 |
| `src/i18n.ts` | 翻訳定義（日本語・英語）とロケール初期化 |
| `src/notificationLogic.ts` | 通知スケジュール計算・登録ロジック |
| `src/offsetLogic.ts` | `generateFuzz` のロジック |
| `modules/soonish-widget/index.ts` | JS 側の `saveSettings` / `loadSettings` ラッパー |
| `modules/soonish-widget/ios/SoonishWidgetModule.swift` | UserDefaults 読み書き + `WidgetCenter.reloadAllTimelines()` |
| `targets/widget/widgets.swift` | WidgetKit タイムライン・ビュー実装 |
| `targets/widget/index.swift` | `@main` ウィジェットバンドル |

## 機能仕様（v1）

- **スケジュール:** 複数登録可能。各スケジュールに曜日・出発時刻・通知前オフセット・ふんわり幅を設定
- **ふんわりモード:** 毎回 `generateFuzz(fuzzMax)` でランダムにずらした時刻で通知
- **通知:** expo-notifications の weekly トリガーで曜日ごとに登録
- **ウィジェット:** 今日の通知予定時刻を表示（App Group 経由）
- **ウィジェット対応サイズ:** systemSmall / accessoryCircular / accessoryRectangular
- **Android:** 未実装（`saveSettings` は no-op）

## 現在の進捗

- スケジュール管理UI（追加・編集・削除・曜日選択）完了
- 多言語対応（日本語・英語）完了
- Mac のシミュレータで動作確認中
- Apple Developer への登録申請中（メール待ち）→ Team ID が確定したら実機テストへ

## 残タスク

### 優先度高

1. **実機での通知動作確認**（シミュレータでは通知のテストが難しい）
2. **ウィジェット表示の改善**（今日のスケジュール通知時刻を正しく反映）
3. **peek画面の活用検討**（現在は本当の時刻表示のまま）

### Team ID 確定後

4. `app.json` の `appleTeamId: "XXXXXXXXXX"` を実際の値に変更
5. Xcode で App Group capability を追加（アプリ本体・ウィジェット拡張の両方）
6. `expo prebuild` → Xcode ビルド → 実機インストール
7. 実機でウィジェット・通知動作確認
