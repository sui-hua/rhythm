import { Pressable, View } from 'react-native'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Menu } from 'lucide-react-native'
import { Text } from '@/components/ui/text'

type DateSwitcherProps = {
  date: Date
  onChange: (date: Date) => void
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function shiftDate(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

// 顶部日期栏：左右箭头切换前后天，中间展示「M月D日 周X」
// 菜单与日历入口为设计稿预留位，后续接入抽屉与日期选择器
export function DateSwitcher({ date, onChange }: DateSwitcherProps) {
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAYS[date.getDay()]

  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <Pressable accessibilityLabel="菜单" className="active:opacity-60">
        <Menu size={22} strokeWidth={2} className="text-foreground" />
      </Pressable>

      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel="前一天"
          hitSlop={8}
          className="active:opacity-60"
          onPress={() => onChange(shiftDate(date, -1))}
        >
          <ChevronLeft size={20} strokeWidth={2} className="text-foreground" />
        </Pressable>

        <View className="flex-row items-center gap-1">
          <Text className="text-lg font-bold tracking-tight">
            {month}月{day}日 {weekday}
          </Text>
          <ChevronDown size={15} strokeWidth={2} className="text-muted-foreground" />
        </View>

        <Pressable
          accessibilityLabel="后一天"
          hitSlop={8}
          className="active:opacity-60"
          onPress={() => onChange(shiftDate(date, 1))}
        >
          <ChevronRight size={20} strokeWidth={2} className="text-foreground" />
        </Pressable>
      </View>

      <Pressable accessibilityLabel="日历" className="active:opacity-60">
        <Calendar size={22} strokeWidth={2} className="text-foreground" />
      </Pressable>
    </View>
  )
}
