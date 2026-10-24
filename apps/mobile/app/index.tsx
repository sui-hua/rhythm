import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuthSession } from '@/features/auth/useAuthSession'

export default function IndexPage() {
  const { isReady, isAuthenticated } = useAuthSession()

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return <Redirect href={isAuthenticated ? '/(app)/day' : '/(auth)/login'} />
}
