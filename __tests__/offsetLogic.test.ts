import { getDisplayTime, generateFuzz } from '../src/offsetLogic'

const d = (h: number, m: number) =>
  new Date(2024, 0, 15, h, m, 0, 0) // 2024-01-15 HH:MM

describe('getDisplayTime — fixed mode', () => {
  test('now + 10min', () => {
    const result = getDisplayTime(d(10, 0), { mode: 'fixed', minutes: 10 })
    expect(result.getHours()).toBe(10)
    expect(result.getMinutes()).toBe(10)
  })

  test('midnight rollover: 23:58 + 5min → 翌日 00:03', () => {
    const result = getDisplayTime(d(23, 58), { mode: 'fixed', minutes: 5 })
    expect(result.getDate()).toBe(16)   // 翌日
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(3)
  })
})

describe('getDisplayTime — fuzzy mode', () => {
  test('fuzz=+2: now + 10 + 2 = +12min', () => {
    const result = getDisplayTime(d(10, 0), { mode: 'fuzzy', minutes: 10, fuzz: 2 })
    expect(result.getHours()).toBe(10)
    expect(result.getMinutes()).toBe(12)
  })

  test('fuzz=-2: now + 10 - 2 = +8min', () => {
    const result = getDisplayTime(d(10, 0), { mode: 'fuzzy', minutes: 10, fuzz: -2 })
    expect(result.getHours()).toBe(10)
    expect(result.getMinutes()).toBe(8)
  })

  test('fuzz=0 (no fuzz): same as fixed', () => {
    const result = getDisplayTime(d(10, 0), { mode: 'fuzzy', minutes: 10, fuzz: 0 })
    expect(result.getMinutes()).toBe(10)
  })
})

describe('generateFuzz', () => {
  test('stays within [-maxFuzz, +maxFuzz]', () => {
    for (let i = 0; i < 200; i++) {
      const v = generateFuzz(2)
      expect(v).toBeGreaterThanOrEqual(-2)
      expect(v).toBeLessThanOrEqual(2)
    }
  })
})
