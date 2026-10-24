import type { DayExecutionItem } from '@/domain/day/types'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'

type SourceBadgeProps = {
  source: DayExecutionItem['source']
  label: DayExecutionItem['categoryLabel']
}

// 设计稿中三类来源统一为中性灰徽章，靠文字区分个人任务/今日计划/日常习惯
export function SourceBadge({ label }: SourceBadgeProps) {
  return (
    <Badge className="self-start rounded-md bg-secondary px-2 py-1">
      <Text className="text-[11px] font-semibold text-secondary-foreground">{label}</Text>
    </Badge>
  )
}
