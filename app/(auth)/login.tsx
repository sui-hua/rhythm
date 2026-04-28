import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
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
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700' }}>Rhythm</Text>
      <Text style={{ marginTop: 8 }}>今日执行，从这里开始</Text>

      <Pressable
        onPress={handleMockLogin}
        style={{ marginTop: 40, backgroundColor: '#1E1E1E', padding: 16, borderRadius: 8 }}
      >
        <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>进入应用 (开发模式)</Text>
      </Pressable>

      <Pressable
        onPress={handleRealLogin}
        style={{ marginTop: 12, backgroundColor: '#DDE9F5', padding: 16, borderRadius: 8 }}
      >
        <Text style={{ color: '#263E57', fontWeight: '700', textAlign: 'center' }}>真实登录</Text>
      </Pressable>
    </View>
  )
}
