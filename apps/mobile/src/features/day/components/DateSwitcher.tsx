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
    <View className="px-4 py-3">
      <View className="flex-row items-center justify-between">
        <Button accessibilityLabel="前一天" onPress={() => onChange(shiftDate(date, -1))} variant="ghost">
          <Text>昨天</Text>
        </Button>

        <View className="items-center">
          <Text className="text-lg font-semibold">今天</Text>
          <Text className="text-sm text-muted-foreground">{month}月{day}日</Text>
        </View>

        <Button accessibilityLabel="后一天" onPress={() => onChange(shiftDate(date, 1))} variant="ghost">
          <Text>明天</Text>
        </Button>
      </View>
    </View>
  )
}
