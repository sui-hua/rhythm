import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import { ExecutionCard } from './ExecutionCard'

type UnscheduledSectionProps = {
  items: DayExecutionItem[]
  onPressItem: (item: DayExecutionItem) => void
  onToggleItem: (item: DayExecutionItem) => void
}

export function UnscheduledSection({ items, onPressItem, onToggleItem }: UnscheduledSectionProps) {
  if (items.length === 0) return null

  return (
    <View className="gap-3 px-5 pb-7 pt-5">
      <Text className="text-lg font-semibold">未安排时间（{items.length}）</Text>
      {items.map((item) => (
        <ExecutionCard key={`${item.source}-${item.id}`} item={item} onPress={onPressItem} onToggle={onToggleItem} />
      ))}
    </View>
  )
}
