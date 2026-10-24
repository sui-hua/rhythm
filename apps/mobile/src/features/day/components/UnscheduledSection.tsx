import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import { cn } from '@/lib/utils'
import { ExecutionCard } from './ExecutionCard'

type UnscheduledSectionProps = {
  items: DayExecutionItem[]
  onPressItem: (item: DayExecutionItem) => void
  onToggleItem: (item: DayExecutionItem) => void
}

// 收集箱：收纳未安排时间的条目，默认折叠，点击头部展开
export function UnscheduledSection({ items, onPressItem, onToggleItem }: UnscheduledSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (items.length === 0) return null

  return (
    <View className="px-5 pb-6 pt-5">
      <Pressable
        onPress={() => setIsOpen((prev) => !prev)}
        accessibilityLabel={`收集箱，${items.length} 条未安排`}
        className="flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm shadow-black/5 active:opacity-90"
      >
        <View className="flex-row items-center gap-2.5">
          <Text className="text-[15px] font-bold">收集箱</Text>
          <View className="h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5">
            <Text className="text-xs font-semibold text-secondary-foreground">{items.length}</Text>
          </View>
        </View>
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={cn('text-muted-foreground', isOpen && 'rotate-180')}
        />
      </Pressable>

      {isOpen ? (
        <View className="mt-3 gap-3">
          {items.map((item) => (
            <ExecutionCard
              key={`${item.source}-${item.id}`}
              item={item}
              onPress={onPressItem}
              onToggle={onToggleItem}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
