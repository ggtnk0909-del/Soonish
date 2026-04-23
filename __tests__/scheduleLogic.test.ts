import { getActiveSlot, validateSlot, Slot } from '../src/scheduleLogic'

const morningSlot: Slot = { from: '07:00', to: '09:00', offset: 10 }

describe('getActiveSlot', () => {
  test('スロット内: 08:00 → offset 10', () => {
    expect(getActiveSlot('08:00', [morningSlot])?.offset).toBe(10)
  })

  test('境界ちょうど from: 07:00 → offset 10', () => {
    expect(getActiveSlot('07:00', [morningSlot])?.offset).toBe(10)
  })

  test('境界ちょうど to: 09:00 → null（スロット外）', () => {
    expect(getActiveSlot('09:00', [morningSlot])).toBeNull()
  })

  test('スロット後: 09:01 → null', () => {
    expect(getActiveSlot('09:01', [morningSlot])).toBeNull()
  })

  test('スロット前: 06:59 → null', () => {
    expect(getActiveSlot('06:59', [morningSlot])).toBeNull()
  })

  test('スロットなし → null', () => {
    expect(getActiveSlot('08:00', [])).toBeNull()
  })
})

describe('validateSlot', () => {
  test('有効なスロット → true', () => {
    expect(validateSlot({ from: '07:00', to: '09:00' })).toBe(true)
  })

  test('日付またがり → false', () => {
    expect(validateSlot({ from: '22:00', to: '02:00' })).toBe(false)
  })

  test('from === to → false', () => {
    expect(validateSlot({ from: '08:00', to: '08:00' })).toBe(false)
  })

  test('from > to（逆順） → false', () => {
    expect(validateSlot({ from: '10:00', to: '09:00' })).toBe(false)
  })
})
