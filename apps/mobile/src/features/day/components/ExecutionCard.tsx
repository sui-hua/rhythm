import { Pressable, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import { cn } from '@/lib/utils'
import { SourceBadge } from './SourceBadge'

type ExecutionCardProps = {
  item: DayExecutionItem
  onPress: (item: DayExecutionItem) => void
  onToggle: (item: DayExecutionItem) => void
}

// 时间轴任务卡：标题 + 时长 + 来源徽章，右侧圆形勾选切换完成态
export function ExecutionCard({ item, onPress, onToggle }: ExecutionCardProps) {
  // 优先展示时长（设计稿形态），无时长时回退到时间段
  const metaText = item.durationMinutes
    ? `${item.durationMinutes} 分钟`
    : item.startAt && item.endAt
      ? `${item.startAt} - ${item.endAt}`
      : null

  return (
    <Pressable
      accessibilityLabel={`查看${item.title}`}
      onPress={() => onPress(item)}
      className="flex-1 flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 active:opacity-90"
    >
      <View className="flex-1 gap-2">
        <Text
          numberOfLines={1}
          className={cn(
            'text-[15px] font-bold tracking-tight',
            item.completed && 'text-muted-foreground line-through'
          )}
        >
          {item.title}
        </Text>
        {metaText ? <Text className="text-xs text-muted-foreground">{metaText}</Text> : null}
        <SourceBadge source={item.source} label={item.categoryLabel} />
      </View>

      {/* 完成切换圆钮：替代原「完成」文字按钮，内层 Pressable 拦截触点，不触发卡片编辑 */}
      <Pressable
        accessibilityLabel={`${item.completed ? '取消完成' : '完成'}${item.title}`}
        onPress={() => onToggle(item)}
        hitSlop={6}
        className={cn(
          'h-7 w-7 items-center justify-center rounded-full',
          item.completed ? 'bg-primary' : 'border-[1.5px] border-zinc-300 bg-background'
        )}
      >
        {item.completed ? (
          <Check size={15} strokeWidth={3} className="text-primary-foreground" />
        ) : null}
      </Pressable>
    </Pressable>
  )
}
