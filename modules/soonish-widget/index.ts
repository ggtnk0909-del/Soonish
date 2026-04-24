import { Platform } from 'react-native'
import { requireNativeModule } from 'expo-modules-core'
import type { Slot } from '../../src/scheduleLogic'

export interface Settings {
  mode: 'fixed' | 'fuzzy'
  offsetMinutes: number
  fuzz: number
  slots: Slot[]
}

/**
 * Saves settings to the App Group UserDefaults and reloads widget timelines.
 * iOS only — on Android this is a no-op until the Android module is implemented.
 */
export async function saveSettings(settings: Settings): Promise<void> {
  if (Platform.OS !== 'ios') return

  const mod = requireNativeModule('SoonishWidget')
  await mod.saveSettings({
    offsetMinutes: settings.offsetMinutes,
    mode: settings.mode,
    fuzz: settings.fuzz,
    slotsJSON: JSON.stringify(settings.slots),
  })
}
