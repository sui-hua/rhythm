import { Menu } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'

type AppHeaderProps = {
  title: string
  right?: React.ReactNode
}

// 页面顶栏：左侧菜单（抽屉入口预留）+ 居中标题 + 右侧操作位
export function AppHeader({ title, right }: AppHeaderProps) {
  return (
    <View className="relative flex-row items-center justify-between px-5 py-3">
      <Pressable accessibilityLabel="菜单" className="active:opacity-60">
        <Menu size={22} strokeWidth={2} className="text-foreground" />
      </Pressable>

      {/* 标题绝对居中，不因两侧宽度不同偏移 */}
      <View className="absolute inset-x-0 items-center" pointerEvents="none">
        <Text className="text-lg font-bold tracking-tight">{title}</Text>
      </View>

      <View className="min-w-[22px] items-end">{right}</View>
    </View>
  )
}
