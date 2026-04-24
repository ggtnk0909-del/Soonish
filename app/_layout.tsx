import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Soonish', headerLargeTitle: true }} />
      <Stack.Screen name="peek" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack>
  )
}
