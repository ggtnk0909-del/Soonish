import { useEffect, useState } from 'react'
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { generateFuzz } from '../src/offsetLogic'
import { validateSlot, type Slot } from '../src/scheduleLogic'
import { saveSettings } from '../modules/soonish-widget'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppSettings {
  mode: 'fixed' | 'fuzzy'
  offsetMinutes: number
  fuzz: number
  slots: Slot[]
}

const PRESET_MINUTES = [5, 10, 15] as const

// ─── Component ────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const [mode, setMode] = useState<'fixed' | 'fuzzy'>('fixed')
  const [offsetMinutes, setOffsetMinutes] = useState(10)
  const [customInput, setCustomInput] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([])
  const [saving, setSaving] = useState(false)

  // Slot editor state
  const [slotFrom, setSlotFrom] = useState('07:00')
  const [slotTo, setSlotTo] = useState('09:00')
  const [slotOffset, setSlotOffset] = useState('10')

  const effectiveMinutes = useCustom
    ? parseInt(customInput, 10) || offsetMinutes
    : offsetMinutes

  async function handleSave() {
    if (useCustom) {
      const v = parseInt(customInput, 10)
      if (isNaN(v) || v < 1 || v > 60) {
        Alert.alert('エラー', 'カスタムオフセットは 1〜60 分で指定してください')
        return
      }
    }

    setSaving(true)
    try {
      const fuzz = mode === 'fuzzy' ? generateFuzz(2) : 0
      const settings: AppSettings = {
        mode,
        offsetMinutes: effectiveMinutes,
        fuzz,
        slots,
      }
      await saveSettings(settings)
      Alert.alert('保存しました', 'ウィジェットに反映されます')
    } catch (e) {
      if (Platform.OS === 'ios') {
        Alert.alert('エラー', '設定の保存に失敗しました。\nApp Group が設定されているか確認してください。')
      } else {
        // Android: native module not yet implemented — just acknowledge
        Alert.alert('保存しました（Android はウィジェット未対応）')
      }
    } finally {
      setSaving(false)
    }
  }

  function handleAddSlot() {
    const candidate = { from: slotFrom, to: slotTo, offset: parseInt(slotOffset, 10) || 0 }
    if (!validateSlot(candidate)) {
      Alert.alert('エラー', '開始時刻 < 終了時刻 にしてください\n（日をまたぐスロットは v1 では未対応）')
      return
    }
    setSlots(prev => [...prev, candidate])
  }

  function handleRemoveSlot(index: number) {
    setSlots(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── Mode ── */}
      <Section title="モード">
        <Row label="ふんわり（ランダム ±2分）">
          <Switch
            value={mode === 'fuzzy'}
            onValueChange={v => setMode(v ? 'fuzzy' : 'fixed')}
          />
        </Row>
        <Text style={styles.hint}>
          {mode === 'fuzzy'
            ? 'オフセットに毎日 ±2分のランダムが加わります。慣れを防げます。'
            : '毎日同じ固定オフセットを表示します。'}
        </Text>
      </Section>

      {/* ── Offset ── */}
      <Section title="オフセット（分）">
        <View style={styles.presetRow}>
          {PRESET_MINUTES.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.preset, !useCustom && offsetMinutes === m && styles.presetActive]}
              onPress={() => { setOffsetMinutes(m); setUseCustom(false) }}
            >
              <Text style={[styles.presetText, !useCustom && offsetMinutes === m && styles.presetTextActive]}>
                {m}分
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customRow}>
          <TouchableOpacity
            style={[styles.preset, useCustom && styles.presetActive]}
            onPress={() => setUseCustom(true)}
          >
            <Text style={[styles.presetText, useCustom && styles.presetTextActive]}>カスタム</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.customInput, useCustom && styles.customInputActive]}
            keyboardType="number-pad"
            placeholder="1〜60"
            value={customInput}
            onChangeText={t => { setCustomInput(t); setUseCustom(true) }}
            maxLength={2}
          />
          <Text style={styles.minLabel}>分</Text>
        </View>
      </Section>

      {/* ── Schedule slots ── */}
      <Section title="時間帯別設定（任意）">
        <Text style={styles.hint}>
          特定の時間帯だけ別のオフセットを使いたい場合に設定します。
          マッチしない時間帯は上のオフセットを使います。
        </Text>

        {slots.map((s, i) => (
          <View key={i} style={styles.slotItem}>
            <Text style={styles.slotText}>{s.from} 〜 {s.to}　+{s.offset}分</Text>
            <TouchableOpacity onPress={() => handleRemoveSlot(i)}>
              <Text style={styles.removeBtn}>削除</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.slotEditor}>
          <TextInput
            style={styles.slotInput}
            placeholder="07:00"
            value={slotFrom}
            onChangeText={setSlotFrom}
            maxLength={5}
          />
          <Text style={styles.slotSep}>〜</Text>
          <TextInput
            style={styles.slotInput}
            placeholder="09:00"
            value={slotTo}
            onChangeText={setSlotTo}
            maxLength={5}
          />
          <TextInput
            style={[styles.slotInput, styles.slotOffsetInput]}
            placeholder="10"
            keyboardType="number-pad"
            value={slotOffset}
            onChangeText={setSlotOffset}
            maxLength={2}
          />
          <Text style={styles.minLabel}>分</Text>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddSlot}>
            <Text style={styles.addBtnText}>追加</Text>
          </TouchableOpacity>
        </View>
      </Section>

      {/* ── Save ── */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? '保存中…' : '保存してウィジェットに反映'}</Text>
      </TouchableOpacity>

    </ScrollView>
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f2f2f7' },
  content: { padding: 20, paddingBottom: 60 },

  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6e6e73',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  hint: { fontSize: 13, color: '#8e8e93', lineHeight: 18, marginTop: 8 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 16, color: '#000', flex: 1 },

  presetRow: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
  },
  presetActive: { backgroundColor: '#007aff' },
  presetText: { fontSize: 15, color: '#000' },
  presetTextActive: { color: '#fff', fontWeight: '600' },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    backgroundColor: '#f2f2f7',
    color: '#000',
  },
  customInputActive: { borderColor: '#007aff', backgroundColor: '#fff' },
  minLabel: { fontSize: 15, color: '#3c3c43' },

  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d1d6',
  },
  slotText: { fontSize: 15, color: '#000' },
  removeBtn: { fontSize: 14, color: '#ff3b30' },

  slotEditor: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, flexWrap: 'wrap' },
  slotInput: {
    borderWidth: 1,
    borderColor: '#d1d1d6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
    backgroundColor: '#f2f2f7',
    width: 70,
    color: '#000',
  },
  slotOffsetInput: { width: 45 },
  slotSep: { fontSize: 15, color: '#3c3c43' },
  addBtn: {
    backgroundColor: '#34c759',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  saveBtn: {
    backgroundColor: '#007aff',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
})
