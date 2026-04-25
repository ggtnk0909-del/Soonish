import { useEffect, useState } from 'react'
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import * as Notifications from 'expo-notifications'
import { loadSettings, saveSettings } from '../modules/soonish-widget'
import {
  requestPermission,
  scheduleAllNotifications,
  calcNotifyMinutes,
  formatHM,
  type Schedule,
} from '../src/notificationLogic'
import i18n from '../src/i18n'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newSchedule(): Schedule {
  return {
    id: String(Date.now()),
    weekdays: [1, 2, 3, 4, 5],  // 月〜金
    departureHour: 7,
    departureMinute: 30,
    offsetMinutes: 20,
    fuzzMax: 5,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Schedule | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'ios') return
    ;(async () => {
      const loaded = await loadSettings()
      if (loaded.isInitialized && loaded.schedulesJSON) {
        try {
          const parsed: Schedule[] = JSON.parse(loaded.schedulesJSON as string)
          setSchedules(parsed)

          // 残り通知が少なければ補充（目安: 2週間分）
          if (parsed.length > 0) {
            const { status } = await Notifications.getPermissionsAsync()
            if (status === 'granted') {
              const existing = await Notifications.getAllScheduledNotificationsAsync()
              if (existing.length < 14) {
                await scheduleAllNotifications(
                  parsed,
                  i18n.t('alarm.notificationTitle'),
                  (time) => i18n.t('alarm.notificationBody', { time }),
                )
              }
            }
          }
        } catch {}
      }
    })()
  }, [])

  async function handleSave(updatedSchedules: Schedule[]) {
    setSaving(true)
    try {
      const granted = await requestPermission()
      if (!granted) {
        Alert.alert(i18n.t('save.errorTitle'), i18n.t('alarm.permissionDenied'))
        return
      }
      const todayNotifyTime = await scheduleAllNotifications(
        updatedSchedules,
        i18n.t('alarm.notificationTitle'),
        (time) => i18n.t('alarm.notificationBody', { time }),
      )
      await saveSettings({
        mode: 'fuzzy',
        offsetMinutes: 0,
        fuzz: 0,
        slots: [],
        schedulesJSON: JSON.stringify(updatedSchedules),
        todayNotifyTime: todayNotifyTime ?? '--:--',
      })
      setSchedules(updatedSchedules)
      Alert.alert(i18n.t('save.successTitle'), i18n.t('alarm.scheduled'))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      Alert.alert(i18n.t('save.errorTitle'), msg)
    } finally {
      setSaving(false)
    }
  }

  function handleAdd() {
    setEditing(newSchedule())
  }

  function handleEdit(s: Schedule) {
    setEditing({ ...s })
  }

  function handleDelete(id: string) {
    Alert.alert(i18n.t('alarm.deleteSchedule'), '', [
      { text: i18n.t('slots.remove'), style: 'destructive', onPress: () => {
        const updated = schedules.filter(s => s.id !== id)
        handleSave(updated)
      }},
      { text: 'キャンセル', style: 'cancel' },
    ])
  }

  function handleEditorSave(s: Schedule) {
    const exists = schedules.find(x => x.id === s.id)
    const updated = exists
      ? schedules.map(x => x.id === s.id ? s : x)
      : [...schedules, s]
    setEditing(null)
    handleSave(updated)
  }

  const days: string[] = i18n.t('alarm.days') as unknown as string[]

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {schedules.length === 0 && (
          <Text style={styles.empty}>{i18n.t('alarm.noSchedules')}</Text>
        )}
        {schedules.length > 0 && (
          <Text style={styles.refreshHint}>{i18n.t('alarm.refreshHint')}</Text>
        )}
        {schedules.map(s => {
          const { hour, minute } = calcNotifyMinutes(s, 0)
          return (
            <View key={s.id} style={styles.card}>
              <TouchableOpacity style={styles.cardBody} onPress={() => handleEdit(s)}>
                <Text style={styles.cardTime}>
                  {formatHM(s.departureHour, s.departureMinute)}
                </Text>
                <Text style={styles.cardSub}>
                  {s.fuzzMax > 0
                    ? i18n.t('alarm.scheduleDesc', { notifyTime: formatHM(hour, minute), offset: s.offsetMinutes, fuzz: s.fuzzMax })
                    : i18n.t('alarm.scheduleDescFixed', { notifyTime: formatHM(hour, minute), offset: s.offsetMinutes })
                  }
                </Text>
                <View style={styles.dayRow}>
                  {[0,1,2,3,4,5,6].map(d => (
                    <View key={d} style={[styles.dayBadge, s.weekdays.includes(d) && styles.dayBadgeActive]}>
                      <Text style={[styles.dayText, s.weekdays.includes(d) && styles.dayTextActive]}>
                        {days[d]}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(s.id)}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAdd} disabled={saving}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {editing && (
        <ScheduleEditor
          schedule={editing}
          onSave={handleEditorSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </View>
  )
}

// ─── Schedule Editor Modal ────────────────────────────────────────────────────

function ScheduleEditor({
  schedule,
  onSave,
  onCancel,
}: {
  schedule: Schedule
  onSave: (s: Schedule) => void
  onCancel: () => void
}) {
  const [s, setS] = useState<Schedule>(schedule)
  const days: string[] = i18n.t('alarm.days') as unknown as string[]

  function toggleDay(d: number) {
    setS(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(d)
        ? prev.weekdays.filter(x => x !== d)
        : [...prev.weekdays, d].sort(),
    }))
  }

  const { hour, minute } = calcNotifyMinutes(s, 0)

  return (
    <Modal animationType="slide" presentationStyle="pageSheet">
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* 通知時刻プレビュー（メイン表示） */}
        {(() => {
          const base = calcNotifyMinutes(s, 0)
          const early = calcNotifyMinutes(s, -s.fuzzMax)
          const late = calcNotifyMinutes(s, s.fuzzMax)
          const buffer = s.offsetMinutes - s.fuzzMax
          return (
            <View style={styles.notifyPreviewCard}>
              <Text style={styles.notifyPreviewTime}>
                {formatHM(s.departureHour, s.departureMinute)}
              </Text>
              <Text style={styles.notifyPreviewBase}>
                {s.fuzzMax > 0
                  ? i18n.t('alarm.scheduleDesc', { notifyTime: formatHM(base.hour, base.minute), offset: s.offsetMinutes, fuzz: s.fuzzMax })
                  : i18n.t('alarm.scheduleDescFixed', { notifyTime: formatHM(base.hour, base.minute), offset: s.offsetMinutes })
                }
              </Text>
              {s.fuzzMax > 0 && (
                <Text style={[styles.notifyPreviewBuffer, buffer <= 5 && styles.notifyPreviewBufferWarn]}>
                  {i18n.t('alarm.minBuffer', { min: buffer })}
                </Text>
              )}
            </View>
          )
        })()}

        <Section title={i18n.t('alarm.title')}>
          <View style={styles.timeRow}>
            <Stepper value={s.departureHour} min={0} max={23}
              onChange={v => setS(p => ({ ...p, departureHour: v }))}
              format={v => String(v).padStart(2, '0')} />
            <Text style={styles.timeSep}>:</Text>
            <Stepper value={s.departureMinute} min={0} max={55} step={5}
              onChange={v => setS(p => ({ ...p, departureMinute: v }))}
              format={v => String(v).padStart(2, '0')} />
          </View>
        </Section>

        <Section title={i18n.t('alarm.offsetTitle')}>
          <View style={styles.stepperRow}>
            <Stepper value={s.offsetMinutes} min={s.fuzzMax + 1} max={60}
              onChange={v => setS(p => ({ ...p, offsetMinutes: v }))} />
            <Text style={styles.unit}>{i18n.t('offset.unit')}</Text>
          </View>
        </Section>

        <Section title={i18n.t('alarm.fuzzTitle')}>
          <View style={styles.stepperRow}>
            <Stepper value={s.fuzzMax} min={0} max={s.offsetMinutes - 1}
              onChange={v => setS(p => ({ ...p, fuzzMax: v }))} />
            <Text style={styles.unit}>{i18n.t('offset.unit')}</Text>
          </View>
        </Section>

        <Section title={i18n.t('alarm.weekdays')}>
          <View style={styles.dayRow}>
            {[0,1,2,3,4,5,6].map(d => (
              <TouchableOpacity key={d}
                style={[styles.dayBadge, s.weekdays.includes(d) && styles.dayBadgeActive]}
                onPress={() => toggleDay(d)}
              >
                <Text style={[styles.dayText, s.weekdays.includes(d) && styles.dayTextActive]}>
                  {days[d]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <View style={styles.editorBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>{i18n.t('save.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, s.weekdays.length === 0 && styles.saveBtnDisabled]}
            onPress={() => {
              if (s.weekdays.length === 0) {
                Alert.alert(i18n.t('save.errorTitle'), i18n.t('save.errorNoWeekdays'))
              } else {
                onSave(s)
              }
            }}
          >
            <Text style={styles.saveBtnText}>{i18n.t('save.button')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </Modal>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Stepper({
  value, min, max, step = 1, onChange,
  format = (v) => String(v),
}: {
  value: number; min: number; max: number; step?: number
  onChange: (v: number) => void; format?: (v: number) => string
}) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.max(min, value - step))}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={styles.stepValue}>{format(value)}</Text>
      <TouchableOpacity
        style={styles.stepBtn}
        onPress={() => onChange(Math.min(max, value + step))}
      >
        <Text style={styles.stepBtnText}>＋</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f2f7' },
  scroll: { flex: 1 },
  content: { padding: 12, paddingBottom: 24 },

  empty: { textAlign: 'center', color: '#8e8e93', marginTop: 60, fontSize: 15 },
  refreshHint: { fontSize: 12, color: '#aeaeb2', textAlign: 'center', marginBottom: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardBody: { flex: 1, padding: 16 },
  cardTime: { fontSize: 36, fontWeight: '200', color: '#000', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#6e6e73', marginBottom: 2 },

  dayRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  dayBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f2f2f7',
    alignItems: 'center', justifyContent: 'center',
  },
  dayBadgeActive: { backgroundColor: '#007aff' },
  dayText: { fontSize: 12, color: '#8e8e93' },
  dayTextActive: { color: '#fff', fontWeight: '600' },

  deleteBtn: { padding: 16, justifyContent: 'center' },
  deleteBtnText: { fontSize: 18, color: '#ff3b30' },

  fab: {
    position: 'absolute', right: 24, bottom: 40,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#007aff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },

  section: {
    backgroundColor: '#fff', borderRadius: 12,
    padding: 12, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#6e6e73',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },

  hint: { fontSize: 13, color: '#8e8e93', lineHeight: 18, marginTop: 8 },
  preview: { fontSize: 14, color: '#007aff', marginTop: 6 },

  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  timeSep: { fontSize: 32, fontWeight: '200', color: '#000' },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  unit: { fontSize: 15, color: '#3c3c43' },

  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f2f2f7',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { fontSize: 20, color: '#007aff' },
  stepValue: { width: 56, textAlign: 'center', fontSize: 24, fontWeight: '200', color: '#000' },

  notifyPreviewCard: {
    backgroundColor: '#007aff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  notifyPreviewTime: { color: '#fff', fontSize: 56, fontWeight: '100', lineHeight: 62 },
  notifyPreviewBase: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginTop: 6 },
  notifyPreviewFuzz: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  notifyPreviewBuffer: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  notifyPreviewBufferWarn: { color: '#ffd60a' },

  editorBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', backgroundColor: '#f2f2f7',
  },
  cancelBtnText: { fontSize: 17, color: '#3c3c43' },
  saveBtn: {
    flex: 2, backgroundColor: '#007aff',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
})
