import { useRouter } from 'expo-router'
import { SafeAreaView, ScrollView, View } from 'react-native'
import { User as UserIcon } from 'lucide-react-native'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import { useAuthSession, setDevMockSession } from '@/features/auth/useAuthSession'
import { signOut } from '@/services/supabase/auth'
import { useMockStore } from '@/mocks/store'

// 设置行：左侧标题 + 右侧内容
function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between border-b border-border px-4 py-3.5 last:border-b-0">
      <Text className="text-[15px]">{label}</Text>
      {children}
    </View>
  )
}

// 我的页：账户信息 + 偏好设置（假数据开关）+ 退出登录
export function MeScreen() {
  const router = useRouter()
  const { session } = useAuthSession()
  const reminderEnabled = useMockStore((state) => state.reminderEnabled)
  const setReminderEnabled = useMockStore((state) => state.setReminderEnabled)

  const email = session?.user?.email ?? '未登录'

  async function handleLogout() {
    // 同时清理本地 mock 会话与真实 Supabase 会话
    setDevMockSession(null)
    try {
      await signOut()
    } catch {
      // 真实会话不存在时忽略
    }
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="我的" />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
        {/* 账户信息卡 */}
        <View className="mx-5 flex-row items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <UserIcon size={24} strokeWidth={2} className="text-secondary-foreground" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-base font-bold tracking-tight">访客用户</Text>
            <Text className="text-sm text-muted-foreground">{email}</Text>
          </View>
        </View>

        {/* 偏好设置 */}
        <Text className="px-5 pb-2 pt-5 text-sm font-semibold text-muted-foreground">设置</Text>
        <View className="mx-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-black/5">
          <SettingRow label="提醒设置">
            <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </SettingRow>
          <SettingRow label="深色模式">
            <Switch checked={false} onCheckedChange={() => {}} />
          </SettingRow>
          <SettingRow label="关于">
            <Text className="text-sm text-muted-foreground">Rhythm v1.0（演示数据）</Text>
          </SettingRow>
        </View>

        {/* 退出登录 */}
        <View className="mx-5 mt-6">
          <Button variant="outline" className="h-12 rounded-xl border-destructive/30" onPress={handleLogout}>
            <Text className="text-danger">退出登录</Text>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
