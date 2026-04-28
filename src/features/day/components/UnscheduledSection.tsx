import { StyleSheet, Text, View } from 'react-native'
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
    <View style={styles.root}>
      <Text style={styles.title}>未安排时间（{items.length}）</Text>
      {items.map((item) => (
        <ExecutionCard key={`${item.source}-${item.id}`} item={item} onPress={onPressItem} onToggle={onToggleItem} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 12
  },
  title: {
    color: '#1E1E1E',
    fontSize: 17,
    fontWeight: '800'
  }
})