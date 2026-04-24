import * as Notifications from 'expo-notifications'
import { generateFuzz } from './offsetLogic'

export interface Schedule {
  id: string
  weekdays: number[]      // 0=日, 1=月, ..., 6=土
  departureHour: number
  departureMinute: number
  offsetMinutes: number
  fuzzMax: number
}

/**
 * 通知時刻を計算する（fuzz込み）
 */
export function calcNotifyMinutes(schedule: Schedule, fuzz: number): { hour: number; minute: number } {
  const totalMinutes =
    schedule.departureHour * 60 +
    schedule.departureMinute -
    schedule.offsetMinutes +
    fuzz
  const h = Math.floor(((totalMinutes % 1440) + 1440) % 1440 / 60)
  const m = ((totalMinutes % 1440) + 1440) % 1440 % 60
  return { hour: h, minute: m }
}

export function formatHM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/**
 * 通知権限を要求する
 */
export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * 全スケジュールの通知を再登録する。
 * 既存の通知を全キャンセルしてから、各スケジュール×曜日で登録。
 * ふんわりのため、毎回 fuzz を再計算する。
 */
/**
 * 全スケジュールの通知を再登録し、今日に該当するスケジュールの通知時刻を返す。
 * 今日に該当するスケジュールが複数ある場合は最も早い通知時刻を返す。
 */
export async function scheduleAllNotifications(
  schedules: Schedule[],
  titleText: string,
  bodyText: (time: string) => string,
): Promise<string | null> {
  await Notifications.cancelAllScheduledNotificationsAsync()

  const todayWeekday = new Date().getDay()  // 0=日, 1=月, ..., 6=土
  let todayNotifyMinutes: number | null = null

  for (const schedule of schedules) {
    const fuzz = schedule.fuzzMax > 0 ? generateFuzz(schedule.fuzzMax) : 0
    const { hour, minute } = calcNotifyMinutes(schedule, fuzz)

    if (schedule.weekdays.includes(todayWeekday)) {
      const total = hour * 60 + minute
      if (todayNotifyMinutes === null || total < todayNotifyMinutes) {
        todayNotifyMinutes = total
      }
    }

    for (const weekday of schedule.weekdays) {
      // expo-notifications: weekday 1=日, 2=月, ..., 7=土
      await Notifications.scheduleNotificationAsync({
        content: {
          title: titleText,
          body: bodyText(formatHM(hour, minute)),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: weekday + 1,  // 0-indexed → 1-indexed
          hour,
          minute,
        },
      })
    }
  }

  if (todayNotifyMinutes === null) return null
  return formatHM(Math.floor(todayNotifyMinutes / 60), todayNotifyMinutes % 60)
}
