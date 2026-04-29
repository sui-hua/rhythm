import type { DayExecutionItem } from '@/domain/day/types'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

type SourceBadgeProps = {
  source: DayExecutionItem['source']
  label: DayExecutionItem['categoryLabel']
}

const variantMap = {
  task: 'bg-task border-transparent',
  daily_plan: 'bg-plan border-transparent',
  habit: 'bg-habit border-transparent'
} satisfies Record<DayExecutionItem['source'], string>

const textMap = {
  task: 'text-[#31451F]',
  daily_plan: 'text-[#263E57]',
  habit: 'text-[#5B4320]'
} satisfies Record<DayExecutionItem['source'], string>

export function SourceBadge({ source, label }: SourceBadgeProps) {
  return (
    <Badge className={cn('rounded-md px-2 py-1', variantMap[source])}>
      <Text className={cn('text-[11px] font-bold', textMap[source])}>{label}</Text>
    </Badge>
  )
}
