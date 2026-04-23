import { OffsetMode } from './offsetLogic'

export interface Slot {
  from: string  // "HH:MM" 24h format
  to: string    // "HH:MM" 24h format, must be > from (cross-midnight not supported in v1)
  offset: number
  mode?: OffsetMode
}

/**
 * Returns the active slot for the given time string "HH:MM".
 * If no slot matches, returns null (caller should use default offset 0).
 */
export function getActiveSlot(time: string, slots: Slot[]): Slot | null {
  for (const slot of slots) {
    if (time >= slot.from && time < slot.to) {
      return slot
    }
  }
  return null
}

/**
 * Validates a slot. Returns true if valid, false if invalid.
 * Cross-midnight slots (from >= to) are not supported in v1.
 */
export function validateSlot(slot: Pick<Slot, 'from' | 'to'>): boolean {
  return slot.from < slot.to
}
