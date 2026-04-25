# Soonish — プロジェクト概要

## アプリ名の由来

**Soonish**（スーニッシュ）— 「もうすぐ」「そろそろ」という少し曖昧で日常的な英語表現。
時間にルーズな自分を可愛くカバーするイメージ。厳密な時刻管理ではなく、ゆるやかに背中を押す存在。

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
- 多言語対応: expo-localization + i18n-js（日本語・英語、デフォルトフォールバックは日本語）
- 通知: expo-notifications（ローカル通知、曜日指定weeklyトリガー）
- テスト: Jest + ts-jest

## 主要ファイル

| パス | 役割 |
|------|------|
| `app/index.tsx` | スケジュール一覧画面（複数スケジュール管理・追加・編集・削除） |
| `app/peek.tsx` | 「本当の時刻」を3秒だけ表示するピーク画面 |
| `src/i18n.ts` | 翻訳定義（日本語・英語）とロケール初期化 |
| `src/notificationLogic.ts` | 通知スケジュール計算・登録ロジック。保存時に今日の通知時刻（`string \| null`）を返す |
| `src/offsetLogic.ts` | `generateFuzz` のロジック |
| `modules/soonish-widget/index.ts` | JS 側の `saveSettings` / `loadSettings` ラッパー |
| `modules/soonish-widget/ios/SoonishWidgetModule.swift` | UserDefaults 読み書き + `WidgetCenter.reloadAllTimelines()` |
| `targets/widget/widgets.swift` | WidgetKit タイムライン・ビュー実装 |
| `targets/widget/index.swift` | `@main` ウィジェットバンドル |
| `assets/icon.png` | アプリアイコン（1024×1024）。`scripts/gen-icon.mjs` で生成 |
| `scripts/gen-icon.mjs` | SVG→PNG変換スクリプト。iOSネイティブプロジェクトにも自動同期 |

## 機能仕様（v1）

### スケジュール管理
- 複数スケジュール登録可能。各スケジュールに曜日・出発時刻・通知前オフセット・ふんわり幅を設定
- UI制約: `offsetMinutes > fuzzMax` を Stepper の min/max で強制
- 分の入力は5分刻み（操作性優先）

### 通知
- expo-notifications の weekly トリガーで曜日ごとに登録
- ふんわりモード: `generateFuzz(fuzzMax)` でランダムにずらした時刻で通知（保存時に fuzz を確定）
- 保存時に今日の曜日に該当するスケジュールの通知時刻を計算し `todayNotifyTime` として UserDefaults に保存

### UI表示
- 一覧カードと編集画面の青枠プレビューで、通知基準時刻を文章形式で統一表示
  - 例: `7:06（出発19分前）±5分でランダムに通知`
  - fuzz なし: `7:06（出発19分前）に通知`
- バッファ（`offsetMinutes - fuzzMax`）が5分以下のとき黄色で「最遅でも出発X分前に通知」警告
- 編集モーダルはスクロールなしでボタンまで表示できるよう余白を最適化済み

### ウィジェット
- `schedulesJSON` から今日の曜日に該当するスケジュールの通知時刻を直接計算して表示
- 今日に該当するスケジュールがない場合は今後7日間で最初に見つかる曜日の時刻を表示
- スケジュール保存時に `WidgetCenter.reloadAllTimelines()` で即時反映
- 長押し→編集で表示するスケジュールを選択可能（`AppIntentConfiguration` + `ScheduleEntityQuery`）
  - `ScheduleEntityQuery` が `schedulesJSON` を読んで動的にスケジュール一覧を提供
  - 未選択時は上記の自動選択ロジックにフォールバック
- `systemSmall` / `accessoryRectangular` には「出発XX分前」サブテキストを表示
- 対応サイズ: systemSmall / accessoryCircular / accessoryRectangular

### アイコン
- デザイン: 青グラデーション背景 × アナログ時計（クリーム色フェイス・ゴールドの針）
- 長針の前10分を扇形で色付け → ランダム通知のコンセプトを視覚化
- アイコンを変更する場合は `node scripts/gen-icon.mjs` を実行（iOSプロジェクトにも自動同期）

### 言語
- 端末の言語設定に自動追従。デフォルトフォールバックは日本語
- シミュレータで日英両方の動作確認済み

### Android
- 未実装（`saveSettings` は no-op）

## i18n キー（主要なもの）

| キー | 用途 |
|------|------|
| `alarm.scheduleDesc` | 文章形式の通知説明（fuzzあり） |
| `alarm.scheduleDescFixed` | 文章形式の通知説明（fuzzなし） |
| `alarm.minBuffer` | バッファ警告テキスト |
| `save.cancel` | キャンセルボタン |
| `save.errorNoWeekdays` | 曜日未選択エラー |
| `widget.selectSchedule` | ウィジェット設定のスケジュール選択ラベル |
| `widget.offsetLabel` | ウィジェットの「出発XX分前」サブテキスト |

## 現在の進捗

- スケジュール管理UI（追加・編集・削除・曜日選択）完了
- 多言語対応（日本語・英語）完了、シミュレータで日英両方確認済み
- UI表示を文章形式に改善、編集モーダルのデザイン最適化完了
- ウィジェットのスケジュール選択・即時反映・サブテキスト表示を実装
- アプリアイコン作成・シミュレータで表示確認済み
- テスト: `calcNotifyMinutes` / `formatHM` / `offsetLogic` / `scheduleLogic` のユニットテスト完備
- **v1 開発完了。Apple Developer 登録申請中（メール待ち）**

## 残タスク（Team ID 確定後）

1. `app.json` の `appleTeamId: "XXXXXXXXXX"` を実際の値に変更
2. Xcode で App Group capability を追加（アプリ本体・ウィジェット拡張の両方）
3. `expo prebuild` → Xcode ビルド → 実機インストール
4. 実機で通知・ウィジェット動作確認
5. ウィジェットスケジュール選択の動作確認（App Group が有効な実機でのみ確認可能）
6. App Store Connect でアプリ登録・審査提出
7. peek画面の活用検討（現在は本当の時刻表示のまま、未活用）
