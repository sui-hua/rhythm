import '../global.css'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import { AppProviders } from '@/providers/AppProviders'

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
    </AppProviders>
  )
}
