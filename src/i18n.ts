import { I18n } from 'i18n-js'
import * as Localization from 'expo-localization'

const translations = {
  en: {
    mode: {
      title: 'Mode',
      fuzzy: 'Fuzzy (random ±2 min)',
      fuzzyHint: 'Adds a random ±2-minute variation to your offset each day. Helps prevent habituation.',
      fixedHint: 'Displays the same fixed offset every day.',
    },
    offset: {
      title: 'Offset (minutes)',
      custom: 'Custom',
      placeholder: '1–60',
      unit: 'min',
      minuteLabel: '%{count} min',
    },
    slots: {
      title: 'Time-based offsets (optional)',
      hint: 'Set a different offset for specific time ranges.\nOther times use the offset above.',
      remove: 'Remove',
      add: 'Add',
      separator: '–',
      itemLabel: '%{from} – %{to}  +%{offset} min',
    },
    save: {
      button: 'Set notification',
      saving: 'Saving…',
      successTitle: 'Saved',
      successMessage: 'Widget will be updated.',
      errorTitle: 'Error',
      errorCustomOffset: 'Custom offset must be between 1 and 60 minutes.',
      errorSaveFailed: 'Failed to save settings.\nMake sure App Group is configured in Xcode.',
      androidSuccess: 'Saved (widget not available on Android)',
      slotError: 'Start time must be before end time\n(cross-midnight slots not supported in v1)',
    },
    peek: {
      label: 'Real time',
      hint: 'Closes in 3 seconds',
    },
    alarm: {
      title: 'Departure time',
      offsetTitle: 'Notify before departure (min)',
      fuzzTitle: 'Random variation (±min)',
      fuzzHint: 'Notification time shifts slightly each day to prevent habituation.',
      todayNotify: "Today's notification: %{time}",
      notificationTitle: 'Time to get ready!',
      notificationBody: "Departure: %{time}",
      permissionDenied: 'Please enable notifications in Settings to use this feature.',
      scheduled: 'Notifications scheduled',
      addSchedule: 'Add schedule',
      editSchedule: 'Edit schedule',
      deleteSchedule: 'Delete',
      weekdays: 'Days',
      noSchedules: 'No schedules yet. Tap + to add one.',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      minBuffer: 'At latest, %{min} min before departure',
      scheduleDesc: 'Notify at %{notifyTime} (%{offset} min before), ±%{fuzz} min random',
      scheduleDescFixed: 'Notify at %{notifyTime} (%{offset} min before departure)',
    },
  },
  ja: {
    mode: {
      title: 'モード',
      fuzzy: 'ふんわり（ランダム ±2分）',
      fuzzyHint: 'オフセットに毎日 ±2分のランダムが加わります。慣れを防げます。',
      fixedHint: '毎日同じ固定オフセットを表示します。',
    },
    offset: {
      title: 'オフセット（分）',
      custom: 'カスタム',
      placeholder: '1〜60',
      unit: '分',
      minuteLabel: '%{count}分',
    },
    slots: {
      title: '時間帯別設定（任意）',
      hint: '特定の時間帯だけ別のオフセットを使いたい場合に設定します。\nマッチしない時間帯は上のオフセットを使います。',
      remove: '削除',
      add: '追加',
      separator: '〜',
      itemLabel: '%{from} 〜 %{to}　+%{offset}分',
    },
    save: {
      button: '通知を設定',
      saving: '保存中…',
      successTitle: '保存しました',
      successMessage: 'ウィジェットに反映されます',
      errorTitle: 'エラー',
      errorCustomOffset: 'カスタムオフセットは 1〜60 分で指定してください',
      errorSaveFailed: '設定の保存に失敗しました。\nApp Group が設定されているか確認してください。',
      androidSuccess: '保存しました（Android はウィジェット未対応）',
      slotError: '開始時刻 < 終了時刻 にしてください\n（日をまたぐスロットは v1 では未対応）',
    },
    peek: {
      label: '本当の時刻',
      hint: '3秒後に閉じます',
    },
    alarm: {
      title: '出発時刻',
      offsetTitle: '何分前に通知するか',
      fuzzTitle: 'ランダム幅（±分）',
      fuzzHint: '毎日少しずつ通知時刻がずれ、慣れを防ぎます。',
      todayNotify: '今日の通知予定: %{time}',
      notificationTitle: '出発の準備を！',
      notificationBody: '出発: %{time}',
      permissionDenied: '通知を使うには設定から通知を許可してください。',
      scheduled: '通知をスケジュールしました',
      addSchedule: 'スケジュールを追加',
      editSchedule: '編集',
      deleteSchedule: '削除',
      weekdays: '曜日',
      noSchedules: 'スケジュールがありません。＋で追加してください。',
      days: ['日', '月', '火', '水', '木', '金', '土'],
      minBuffer: '最遅でも出発%{min}分前に通知',
      scheduleDesc: '%{notifyTime}（出発%{offset}分前）±%{fuzz}分でランダムに通知',
      scheduleDescFixed: '%{notifyTime}（出発%{offset}分前）に通知',
    },
  },
}

const i18n = new I18n(translations)
i18n.locale = Localization.getLocales()[0]?.languageCode ?? 'ja'
i18n.enableFallback = true
i18n.defaultLocale = 'ja'

export default i18n
