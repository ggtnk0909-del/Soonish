export type OffsetMode = 'fixed' | 'fuzzy'

export interface OffsetConfig {
  mode: OffsetMode
  minutes: number // base offset in minutes
  fuzz?: number   // pre-computed fuzz value (±N minutes), required when mode='fuzzy'
}

/**
 * Returns a new Date with the offset applied.
 * fuzz must be pre-computed once per day and passed in — do not call Math.random() here.
 */
export function getDisplayTime(now: Date, config: OffsetConfig): Date {
  const totalMinutes = config.mode === 'fuzzy'
    ? config.minutes + (config.fuzz ?? 0)
    : config.minutes

  const result = new Date(now.getTime() + totalMinutes * 60 * 1000)
  return result
}

/**
 * Generates a random fuzz value in the range [-maxFuzz, +maxFuzz].
 * Call once per day and persist the result. Do not call per-minute.
 */
export function generateFuzz(maxFuzz: number): number {
  return Math.floor(Math.random() * (maxFuzz * 2 + 1)) - maxFuzz
}
