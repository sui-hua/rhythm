import { router } from 'expo-router'
import { SafeAreaView, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { setDevMockSession } from '@/features/auth/useAuthSession'
import { signInWithPassword } from '@/services/supabase/auth'

export default function LoginPage() {
  function handleMockLogin() {
    // Set mock session to bypass auth in development
    setDevMockSession({ id: 'dev', email: 'dev@localhost', user: {} } as any)
    router.replace('/(app)/day')
  }

  async function handleRealLogin() {
    try {
      await signInWithPassword('test@example.com', 'password')
      router.replace('/(app)/day')
    } catch (e) {
      console.error('Login failed:', e)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Rhythm</CardTitle>
            <CardDescription>今日执行，从这里开始</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button onPress={handleMockLogin}>
              <Text>进入应用（开发模式）</Text>
            </Button>
            <Button variant="secondary" onPress={handleRealLogin}>
              <Text>真实登录</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  )
}
