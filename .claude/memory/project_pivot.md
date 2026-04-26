---
name: Soonish concept pivot
description: App concept changed from widget time display to randomized morning alarm notifications
type: project
---

コンセプトをウィジェット時刻表示からローカル通知アラームに変更。

**Why:** iOSのロック画面は時刻を消せないため、ずらした時刻を表示しても本物と並んで見えてしまい自己欺瞞の効果が薄い。

**新コンセプト:** 「7:30に出発したい → 毎日ランダムにずれた時刻（例:7:06, 7:13, 7:08）でローカル通知を鳴らす。慣れを防いで時間的余裕を生む」という仮説。

**技術選択:** iOSローカル通知（標準アラームには連携不可）。リリース後のフィードバックで再検討予定。

**How to apply:** UIは「出発時刻」+「何分前に通知か」+「ふんわり幅」の設定に再設計。ウィジェットは「今日のアラーム予定時刻」表示に転用できる。
