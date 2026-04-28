import { StyleSheet, Text, View } from 'react-native'
import type { DayExecutionItem } from '@/domain/day/types'
import { ExecutionCard } from './ExecutionCard'

type ExecutionTimelineProps = {
  items: DayExecutionItem[]
  onPressItem: (item: DayExecutionItem) => void
  onToggleItem: (item: DayExecutionItem) => void
}

export function ExecutionTimeline({ items, onPressItem, onToggleItem }: ExecutionTimelineProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>TODAY</Text>
      {items.map((item) => (
        <View key={`${item.source}-${item.id}`} style={styles.row}>
          <Text style={styles.hour}>{formatHour(item.startMinutes)}</Text>
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

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14
  },
  label: {
    color: '#756F63',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0
  },
  row: {
    gap: 8
  },
  hour: {
    color: '#756F63',
    fontSize: 13,
    fontWeight: '700'
  }
})