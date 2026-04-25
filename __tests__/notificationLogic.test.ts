import { calcNotifyMinutes, formatHM } from '../src/notificationLogic'

// ── calcNotifyMinutes ──────────────────────────────────────────────────────────

describe('calcNotifyMinutes', () => {
  const base = { id: '1', weekdays: [1], offsetMinutes: 20, fuzzMax: 5 }

  test('基本: 7:30出発 20分前 fuzz=0 → 7:10', () => {
    const s = { ...base, departureHour: 7, departureMinute: 30 }
    expect(calcNotifyMinutes(s, 0)).toEqual({ hour: 7, minute: 10 })
  })

  test('fuzz+5: 7:30出発 20分前 → 7:15', () => {
    const s = { ...base, departureHour: 7, departureMinute: 30 }
    expect(calcNotifyMinutes(s, 5)).toEqual({ hour: 7, minute: 15 })
  })

  test('fuzz-5: 7:30出発 20分前 → 7:05', () => {
    const s = { ...base, departureHour: 7, departureMinute: 30 }
    expect(calcNotifyMinutes(s, -5)).toEqual({ hour: 7, minute: 5 })
  })

  test('日付またがり: 0:10出発 20分前 → 前日 23:50', () => {
    const s = { ...base, departureHour: 0, departureMinute: 10 }
    expect(calcNotifyMinutes(s, 0)).toEqual({ hour: 23, minute: 50 })
  })

  test('ちょうど0分: 出発 - offset = 0:00', () => {
    const s = { ...base, departureHour: 0, departureMinute: 20, offsetMinutes: 20 }
    expect(calcNotifyMinutes(s, 0)).toEqual({ hour: 0, minute: 0 })
  })

  test('23:59出発 1分前 fuzz=0 → 23:58', () => {
    const s = { ...base, departureHour: 23, departureMinute: 59, offsetMinutes: 1 }
    expect(calcNotifyMinutes(s, 0)).toEqual({ hour: 23, minute: 58 })
  })

  test('offset=60: 7:00出発 60分前 → 6:00', () => {
    const s = { ...base, departureHour: 7, departureMinute: 0, offsetMinutes: 60 }
    expect(calcNotifyMinutes(s, 0)).toEqual({ hour: 6, minute: 0 })
  })

  test('fuzzで負方向の日付またがり: 0:05出発 10分前 fuzz=-5 → 前日 23:50', () => {
    const s = { ...base, departureHour: 0, departureMinute: 5, offsetMinutes: 10 }
    expect(calcNotifyMinutes(s, -5)).toEqual({ hour: 23, minute: 50 })
  })
})

// ── formatHM ──────────────────────────────────────────────────────────────────

describe('formatHM', () => {
  test('ゼロパディング: 7:06 → "07:06"', () => {
    expect(formatHM(7, 6)).toBe('07:06')
  })

  test('0:00 → "00:00"', () => {
    expect(formatHM(0, 0)).toBe('00:00')
  })

  test('23:59 → "23:59"', () => {
    expect(formatHM(23, 59)).toBe('23:59')
  })

  test('12:30 → "12:30"', () => {
    expect(formatHM(12, 30)).toBe('12:30')
  })
})
