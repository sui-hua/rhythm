import { Pressable, View } from 'react-native'
import { Card, CardContent } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import type { DayExecutionItem } from '@/domain/day/types'
import { cn } from '@/lib/utils'
import { SourceBadge } from './SourceBadge'

type ExecutionCardProps = {
  item: DayExecutionItem
  onPress: (item: DayExecutionItem) => void
  onToggle: (item: DayExecutionItem) => void
}

export function ExecutionCard({ item, onPress, onToggle }: ExecutionCardProps) {
  const timeText = item.startAt && item.endAt ? `${item.startAt} - ${item.endAt}` : '未安排时间'

  return (
    <Pressable accessibilityLabel={`查看${item.title}`} onPress={() => onPress(item)}>
      <Card className="rounded-lg border-border bg-card py-0 shadow-none">
        <CardContent className="flex-row gap-3 px-4 py-4">
          <Pressable
            accessibilityLabel={`${item.completed ? '取消完成' : '完成'}${item.title}`}
            className="h-7 w-7 items-center justify-center"
            onPress={() => onToggle(item)}
          >
            <Text className="text-[20px] font-extrabold text-foreground">
              {item.completed ? '●' : '○'}
            </Text>
          </Pressable>

          <View className="flex-1 gap-2">
            <Text
              className={cn(
                'text-base font-extrabold text-foreground',
                item.completed && 'text-[#827B6E] line-through'
              )}
            >
              {item.title}
            </Text>

            <View className="flex-row flex-wrap items-center gap-2">
              <SourceBadge source={item.source} label={item.categoryLabel} />
              <Text className="text-[12px] font-semibold text-muted">{timeText}</Text>
            </View>

            {item.description ? (
              <Text className="text-[13px] leading-[18px] text-[#625C52]">{item.description}</Text>
            ) : null}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}
