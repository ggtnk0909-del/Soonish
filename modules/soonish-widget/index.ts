import { Platform } from 'react-native'
import { requireNativeModule } from 'expo-modules-core'

export interface Settings {
  mode: 'fixed' | 'fuzzy'
  offsetMinutes: number
  fuzz: number
  slots: any[]
  schedulesJSON?: string
  todayNotifyTime?: string
}

export interface LoadedSettings {
  isInitialized: boolean
  schedulesJSON?: string
  todayNotifyTime?: string
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (Platform.OS !== 'ios') return
  const mod = requireNativeModule('SoonishWidget')
  await mod.saveSettings({
    offsetMinutes: settings.offsetMinutes,
    mode: settings.mode,
    fuzz: settings.fuzz,
    slotsJSON: JSON.stringify(settings.slots),
    schedulesJSON: settings.schedulesJSON,
    todayNotifyTime: settings.todayNotifyTime,
  })
}

export async function loadSettings(): Promise<LoadedSettings> {
  if (Platform.OS !== 'ios') {
    return { isInitialized: false }
  }
  const mod = requireNativeModule('SoonishWidget')
  return await mod.loadSettings()
}
