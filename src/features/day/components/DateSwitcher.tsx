import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

type DateSwitcherProps = {
  date: Date
  onChange: (date: Date) => void
}

function shiftDate(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function DateSwitcher({ date, onChange }: DateSwitcherProps) {
  const month = date.getMonth() + 1
  const day = date.getDate()

  return (
    <View className="flex-row items-center justify-between px-5 py-4">
      <Button
        accessibilityLabel="前一天"
        className="min-w-[84px] items-start bg-transparent px-0 shadow-none"
        onPress={() => onChange(shiftDate(date, -1))}
        size="sm"
        variant="ghost"
      >
        <Text className="text-sm font-semibold text-muted">‹ 昨天</Text>
      </Button>

      <View className="items-center gap-0.5">
        <Text className="text-[22px] font-extrabold text-foreground">今天</Text>
        <Text className="text-xs text-muted">{month}月{day}日</Text>
      </View>

      <Button
        accessibilityLabel="后一天"
        className="min-w-[84px] items-end bg-transparent px-0 shadow-none"
        onPress={() => onChange(shiftDate(date, 1))}
        size="sm"
        variant="ghost"
      >
        <Text className="text-sm font-semibold text-muted">明天 ›</Text>
      </Button>
    </View>
  )
}
