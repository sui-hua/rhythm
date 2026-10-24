import { useState } from 'react'
import { router } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Text } from '@/components/ui/text'
import { setDevMockSession } from '@/features/auth/useAuthSession'
import { signInWithPassword } from '@/services/supabase/auth'

// 设计稿（UI/登录.png）标注的访客演示账号
const DEMO_EMAIL = '123456@163.com'
const DEMO_PASSWORD = '123456'

// 登录页：品牌区 + 邮箱密码表单 + 首次使用建议 + 演示账号提示
export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    // 空值或重复提交直接忽略
    if (!email || !password || submitting) return
    setSubmitting(true)
    setErrorMessage(null)
    try {
      await signInWithPassword(email, password)
      router.replace('/(app)/day')
    } catch {
      setErrorMessage('登录失败，请检查邮箱与密码')
    } finally {
      setSubmitting(false)
    }
  }

  // 本地 mock 会话，无 Supabase 账号时体验与联调用
  function handleMockLogin() {
    setDevMockSession({ id: 'dev', email: 'dev@localhost', user: {} } as any)
    router.replace('/(app)/day')
  }

  // 一键填入演示账号，避免手输
  function fillDemoAccount() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setErrorMessage(null)
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {/* 品牌区：圆环 Logo + 标题 + 标语 */}
          <View className="items-center pt-16">
            <View className="relative h-20 w-20 items-center justify-center">
              <View className="h-16 w-16 rounded-full border-[3px] border-foreground" />
              <View className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-foreground" />
            </View>
            <Text className="mt-5 text-4xl font-extrabold tracking-tight">Rhythm</Text>
            <Text className="mt-2 text-base text-muted-foreground">记录节奏 · 看见成长</Text>
          </View>

          {/* 表单区：邮箱 / 密码 / 登录按钮 */}
          <View className="gap-5 px-8 pt-12">
            <View className="gap-2">
              <Text className="text-sm font-medium">邮箱</Text>
              <View>
                <Mail size={18} strokeWidth={2} className="absolute left-3.5 top-[15px] text-muted-foreground" />
                <Input
                  className="h-12 rounded-xl pl-11"
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-medium">密码</Text>
              <View>
                <Lock size={18} strokeWidth={2} className="absolute left-3.5 top-[15px] text-muted-foreground" />
                <Input
                  className="h-12 rounded-xl pl-11 pr-11"
                  placeholder="请输入密码"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  accessibilityLabel={showPassword ? '隐藏密码' : '显示密码'}
                  onPress={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-[15px] active:opacity-60"
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={2} className="text-muted-foreground" />
                  ) : (
                    <Eye size={18} strokeWidth={2} className="text-muted-foreground" />
                  )}
                </Pressable>
              </View>
            </View>

            <Button
              className="h-12 rounded-xl"
              onPress={handleSubmit}
              disabled={submitting || !email || !password}
            >
              <Text className="text-base font-semibold">{submitting ? '登录中…' : '登录'}</Text>
            </Button>
            {errorMessage ? (
              <Text className="text-center text-sm text-danger">{errorMessage}</Text>
            ) : null}
          </View>

          {/* 首次使用建议 */}
          <View className="mx-8 mt-8 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} strokeWidth={2} className="text-foreground" />
              <Text className="font-bold">第一次使用建议</Text>
            </View>
            <View className="mt-3 gap-2">
              <Text className="text-sm leading-6 text-muted-foreground">
                1. 先进入 Day，确认今天的计划与节奏
              </Text>
              <Text className="text-sm leading-6 text-muted-foreground">2. 习惯打卡，建立稳定动作</Text>
              <Text className="text-sm leading-6 text-muted-foreground">3. 设定一个长期目标，开启新的之旅</Text>
            </View>
          </View>

          {/* 底部：演示账号填入 + 免登录体验 */}
          <View className="mt-auto items-center gap-3 pb-8 pt-10">
            <Pressable onPress={fillDemoAccount} className="active:opacity-60">
              <Text className="text-xs text-muted-foreground">
                访客体验账号　{DEMO_EMAIL} / {DEMO_PASSWORD}（点击填入）
              </Text>
            </Pressable>
            <Pressable onPress={handleMockLogin} className="active:opacity-60">
              <Text className="text-xs text-muted-foreground underline">不登录，直接体验</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
