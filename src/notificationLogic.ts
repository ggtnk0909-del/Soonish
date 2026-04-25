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

const MAX_NOTIFICATIONS = 60
const WEEKS_AHEAD = 8

/**
 * 全スケジュールの通知を再登録し、今日に該当するスケジュールの通知時刻を返す。
 * 各曜日ごとに独立したfuzzを生成し、DATE triggerで個別に登録する（最大60件・8週先まで）。
 */
export async function scheduleAllNotifications(
  schedules: Schedule[],
  titleText: string,
  bodyText: (time: string) => string,
): Promise<string | null> {
  await Notifications.cancelAllScheduledNotificationsAsync()

  const now = new Date()
  const todayMidnight = new Date(now)
  todayMidnight.setHours(0, 0, 0, 0)

  let todayNotifyMinutes: number | null = null
  let count = 0

  for (let dayOffset = 0; dayOffset < WEEKS_AHEAD * 7 && count < MAX_NOTIFICATIONS; dayOffset++) {
    const departureDay = new Date(todayMidnight)
    departureDay.setDate(todayMidnight.getDate() + dayOffset)
    const weekday = departureDay.getDay()

    for (const schedule of schedules) {
      if (!schedule.weekdays.includes(weekday)) continue
      if (count >= MAX_NOTIFICATIONS) break

      const fuzz = schedule.fuzzMax > 0 ? generateFuzz(schedule.fuzzMax) : 0
      const rawMinutes = schedule.departureHour * 60 + schedule.departureMinute - schedule.offsetMinutes + fuzz
      const { hour, minute } = calcNotifyMinutes(schedule, fuzz)

      const notifyDate = new Date(departureDay)
      if (rawMinutes < 0) notifyDate.setDate(notifyDate.getDate() - 1)
      notifyDate.setHours(hour, minute, 0, 0)

      if (notifyDate <= now) continue

      const notifyMidnight = new Date(notifyDate)
      notifyMidnight.setHours(0, 0, 0, 0)
      if (notifyMidnight.getTime() === todayMidnight.getTime()) {
        const total = hour * 60 + minute
        if (todayNotifyMinutes === null || total < todayNotifyMinutes) {
          todayNotifyMinutes = total
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: titleText,
          body: bodyText(formatHM(hour, minute)),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notifyDate,
        },
      })
      count++
    }
  }

  if (todayNotifyMinutes === null) return null
  return formatHM(Math.floor(todayNotifyMinutes / 60), todayNotifyMinutes % 60)
}
