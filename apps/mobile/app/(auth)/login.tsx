import { useState } from 'react'
import { router } from 'expo-router'
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { signInLocal } from '@/features/auth/useAuthSession'

// 登录页：与 web 端保持一致，只留品牌标识与邮箱密码表单
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    // 空值或重复提交直接忽略
    if (!email || !password || submitting) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      // 后端认证模块尚未落地，这里只建立本地会话并带上固定 user_id
      signInLocal(email)
      router.replace('/(app)/day')
    } catch {
      setErrorMessage('登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 品牌区：图形标识 + 名称 */}
          <View className="items-center">
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel="Rhythm 标志"
            />
            <Text className="mt-4 text-2xl font-bold tracking-tight">Rhythm</Text>
          </View>

          {/* 表单区：邮箱 / 密码 / 登录 */}
          <View className="mt-10 gap-4 px-8">
            <View className="gap-2">
              <Text className="text-xs font-bold tracking-wide text-muted-foreground">邮箱</Text>
              <Input
                className="h-11 rounded-lg"
                placeholder="name@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View className="gap-2">
              <Text className="text-xs font-bold tracking-wide text-muted-foreground">密码</Text>
              <Input
                className="h-11 rounded-lg"
                placeholder="请输入密码"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {errorMessage ? <Text className="text-sm font-medium text-danger">{errorMessage}</Text> : null}

            <Button
              className="mt-2 h-11 rounded-lg"
              onPress={handleSubmit}
              disabled={submitting || !email || !password}
            >
              <Text className="text-base font-semibold">{submitting ? '登录中…' : '登录'}</Text>
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
