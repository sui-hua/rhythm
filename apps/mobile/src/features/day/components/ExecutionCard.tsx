import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card>
        <CardHeader>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-2">
              <CardTitle className={cn(item.completed && 'text-muted-foreground line-through')}>
                {item.title}
              </CardTitle>
              <SourceBadge source={item.source} label={item.categoryLabel} />
            </View>
            <Button
              accessibilityLabel={`${item.completed ? '取消完成' : '完成'}${item.title}`}
              onPress={() => onToggle(item)}
              size="sm"
              variant="ghost"
            >
              <Text>{item.completed ? '已完成' : '完成'}</Text>
            </Button>
          </View>
        </CardHeader>
        <CardContent className="gap-2">
          <Text className="text-sm text-muted-foreground">{timeText}</Text>
          {item.description ? <Text className="text-sm leading-5">{item.description}</Text> : null}
        </CardContent>
      </Card>
    </Pressable>
  )
}
