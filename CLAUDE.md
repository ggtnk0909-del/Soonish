# Soonish — プロジェクト概要

## 目的

現在時刻より少し先の時刻を表示する iOS アプリ＋ホーム画面ウィジェット。
「時計を意図的にずらして遅刻を防ぐ」体験を提供する。
ウィジェットには先の時刻だけ表示し、設定画面にオフセット値を隠すことで「どうせずらしてる」という慣れを防ぐ設計。

## 技術スタック

- Expo (React Native) + expo-router + TypeScript
- iOS ウィジェット: SwiftUI / WidgetKit
- カスタム Native Module: Expo Modules Core
- App Group: `group.com.hidet.soonish` で UserDefaults を共有
- 多言語対応: expo-localization + i18n-js（日本語・英語）
- テスト: Jest + ts-jest

## 主要ファイル

| パス | 役割 |
|------|------|
| `app/index.tsx` | 設定画面（モード・オフセット・スロット・保存ボタン） |
| `app/peek.tsx` | 「本当の時刻」を3秒だけ表示するピーク画面 |
| `src/i18n.ts` | 翻訳定義（日本語・英語）とロケール初期化 |
| `src/offsetLogic.ts` | `getDisplayTime` / `generateFuzz` のロジック |
| `src/scheduleLogic.ts` | `Slot` 型・`getActiveSlot` / `validateSlot` |
| `modules/soonish-widget/index.ts` | JS 側の `saveSettings` ラッパー |
| `modules/soonish-widget/ios/SoonishWidgetModule.swift` | UserDefaults 書き込み + `WidgetCenter.reloadAllTimelines()` |
| `targets/widget/widgets.swift` | WidgetKit タイムライン・ビュー実装 |
| `targets/widget/index.swift` | `@main` ウィジェットバンドル |

## 機能仕様（v1）

- **モード:** `fixed`（固定）/ `fuzzy`（±2分ランダム、毎日変わる想定）
- **オフセット:** 5 / 10 / 15 分プリセット or カスタム (1〜60)
- **スロット:** 時間帯ごとに別オフセットを設定可能（日またぎ未対応）
- **ウィジェット対応サイズ:** systemSmall / accessoryCircular / accessoryRectangular
- **Android:** ウィジェット未実装（`saveSettings` は Android では no-op）

## 現在の進捗

- 基本実装（設定画面・ウィジェット表示）は完了
- 多言語対応（日本語・英語）完了 ※ npm install が必要
- Mac のシミュレータで動作確認中
- Apple Developer への登録申請中（メール待ち）→ Team ID が確定したら実機テストへ

## 残タスク

### 優先度高（Team ID 待ちの間に対応予定）

1. **スロットをウィジェットに反映する**
   - `SoonishWidgetModule.swift` は `slotsJSON` を UserDefaults に保存しているが
   - `targets/widget/widgets.swift` 側で読み取っていない
   - `SoonishSettings` に `slots` のパースを追加し、`getTimeline` で時間帯マッチングを行う

2. **fuzz の毎日リセット**
   - 現状は「保存ボタンを押したとき」にしか fuzz が更新されない
   - ウィジェットのタイムライン更新タイミングで日付チェックし、日付が変わっていたら再計算する仕組みが必要

3. **widgets.swift の説明文ローカライズ**
   - `.description("少し先の時刻を表示して遅刻を防ぎます。")` を Xcode の Localizable.strings で対応

### Team ID 確定後

4. `app.json` の `appleTeamId: "XXXXXXXXXX"` を実際の値に変更
5. Xcode で App Group capability を追加（アプリ本体・ウィジェット拡張の両方）
6. `expo prebuild` → Xcode ビルド → 実機インストール
7. 実機でウィジェット動作確認（ホーム画面・ロック画面）
