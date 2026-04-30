import { router } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Music } from 'lucide-react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Text } from '@/components/ui/text'
import { setDevMockSession } from '@/features/auth/useAuthSession'
import { signInWithPassword } from '@/services/supabase/auth'

export default function LoginPage() {
  function handleMockLogin() {
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
      <View className="flex-1 justify-between px-6 py-8">
        <View className="gap-5 pt-8">
          <View className="h-14 w-14 items-center justify-center rounded-lg border border-border bg-card">
            <Music className="text-2xl" />
          </View>

          <View className="gap-3">
            <Text className="text-5xl font-extrabold tracking-tight">Rhythm</Text>
            <Text className="text-base leading-6 text-muted-foreground">
              把今天的安排整理成清晰、可执行的节奏。
            </Text>
          </View>
        </View>

        <Card className="gap-5">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">开始今天</CardTitle>
            <CardDescription>进入后查看日程、任务与习惯执行状态。</CardDescription>
          </CardHeader>

          <CardContent className="gap-3">
            <Button onPress={handleMockLogin}>
              <Text>进入应用</Text>
            </Button>
            <Button variant="secondary" onPress={handleRealLogin}>
              <Text>登录账号</Text>
            </Button>
          </CardContent>

          <Separator />

          <CardFooter>
            <Text className="text-sm leading-5 text-muted-foreground">
              专注今天要完成的事，减少在计划和执行之间来回切换。
            </Text>
          </CardFooter>
        </Card>
      </View>
    </SafeAreaView>
  )
}
