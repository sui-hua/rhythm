import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import { cn } from '@/lib/utils'
import { ExecutionCard } from './ExecutionCard'

type ExecutionTimelineProps = {
  items: DayExecutionItem[]
  onPressItem: (item: DayExecutionItem) => void
  onToggleItem: (item: DayExecutionItem) => void
}

// startMinutes 为权威时间源（分钟数），startAt 仅作展示回退
function formatTime(minutes: number | null, fallback: string | null) {
  if (minutes !== null) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0')
    const m = String(minutes % 60).padStart(2, '0')
    return `${h}:${m}`
  }
  return fallback ? fallback.slice(0, 5) : ''
}

// 时间轴：左侧时刻 → 圆点竖线轨道 → 任务卡；已完成项圆点实心
export function ExecutionTimeline({ items, onPressItem, onToggleItem }: ExecutionTimelineProps) {
  if (items.length === 0) return null

  return (
    <View className="gap-4 px-5 pt-1">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <View key={`${item.source}-${item.id}`} className="flex-row gap-3">
            <Text className="w-11 pt-[17px] text-xs font-semibold text-muted-foreground">
              {formatTime(item.startMinutes, item.startAt)}
            </Text>

            {/* 轨道：圆点 + 连接线，末项不画线 */}
            <View className="items-center">
              <View
                className={cn(
                  'mt-[18px] h-3 w-3 rounded-full',
                  item.completed ? 'bg-primary' : 'border-2 border-zinc-300 bg-background'
                )}
              />
              {!isLast ? <View className="w-px flex-1 bg-border" /> : null}
            </View>

            <ExecutionCard item={item} onPress={onPressItem} onToggle={onToggleItem} />
          </View>
        )
      })}
    </View>
  )
}
