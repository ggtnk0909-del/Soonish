import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import i18n from '../src/i18n'

export default function PeekScreen() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    const dismiss = setTimeout(() => router.replace('/'), 3000)
    return () => {
      clearInterval(tick)
      clearTimeout(dismiss)
    }
  }, [])

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{i18n.t('peek.label')}</Text>
      <Text style={styles.time}>{hh}:{mm}:{ss}</Text>
      <Text style={styles.hint}>{i18n.t('peek.hint')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#888',
    fontSize: 16,
    marginBottom: 12,
  },
  time: {
    color: '#fff',
    fontSize: 72,
    fontWeight: '100',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    color: '#555',
    fontSize: 13,
    marginTop: 16,
  },
})
