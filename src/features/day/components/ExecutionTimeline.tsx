import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import { ExecutionCard } from './ExecutionCard'

type ExecutionTimelineProps = {
  items: DayExecutionItem[]
  onPressItem: (item: DayExecutionItem) => void
  onToggleItem: (item: DayExecutionItem) => void
}

export function ExecutionTimeline({ items, onPressItem, onToggleItem }: ExecutionTimelineProps) {
  return (
    <View className="gap-3 px-5 pt-2">
      <Text className="text-xs font-semibold text-muted-foreground">TODAY</Text>
      {items.map((item) => (
        <View key={`${item.source}-${item.id}`} className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">{formatHour(item.startMinutes)}</Text>
          <ExecutionCard item={item} onPress={onPressItem} onToggle={onToggleItem} />
        </View>
      ))}
    </View>
  )
}

function formatHour(minutes: number | null) {
  if (minutes === null) return ''
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:00`
}
