import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Check, ChevronDown } from 'lucide-react-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { goalMonthProgress, goalProgress, isGoalDayCompleted } from '@/domain/direction/progress'
import { cn } from '@/lib/utils'
import type { GoalItem } from '@/services/api/goals'

type GoalDetailSheetProps = {
  goal: GoalItem | null
  isSaving: boolean
  onToggleDay: (goalDayId: string, completed: boolean) => Promise<void>
  onClose: () => void
}

/** 月份标题：库里 month 是 date，展示成「2026 年 10 月」 */
function formatMonthLabel(month: string | null): string {
  if (!month) return '未命名月份'
  const [year, monthPart] = month.split('-')
  return `${year} 年 ${Number(monthPart)} 月`
}

// 目标详情：总进度 + 月度 → 日计划两级展开，日计划可直接勾选
export function GoalDetailSheet({ goal, isSaving, onToggleDay, onClose }: GoalDetailSheetProps) {
  const [openMonthId, setOpenMonthId] = useState<string | null>(null)

  // 切换目标时默认展开第一个月
  useEffect(() => {
    setOpenMonthId(goal?.months[0]?.id ?? null)
  }, [goal?.id])

  const percent = goal ? Math.round(goalProgress(goal) * 100) : 0
  const stage = goal?.status === 'completed' ? '已完成' : percent > 0 ? '进行中' : '待开始'

  return (
    <Dialog open={Boolean(goal)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        {goal ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-left text-xl font-bold tracking-tight">{goal.title}</DialogTitle>
              <View className="flex-row items-center gap-2">
                <Badge variant="secondary" className="rounded-md">
                  <Text className="text-[11px] font-semibold text-secondary-foreground">{stage}</Text>
                </Badge>
                <Text className="flex-1 text-sm text-muted-foreground">{goal.description || '暂无描述'}</Text>
              </View>
            </DialogHeader>

            {/* 总进度 */}
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold">总进度</Text>
                <Text className="text-lg font-extrabold tracking-tight">{percent}%</Text>
              </View>
              <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </View>
            </View>

            {/* 月度 → 日计划级联 */}
            <View className="gap-2">
              <Text className="text-sm font-semibold">月度计划</Text>
              {goal.months.length === 0 ? (
                <Text className="py-3 text-sm text-muted-foreground">暂无月度计划记录</Text>
              ) : null}
              {goal.months.map((month) => {
                const open = openMonthId === month.id
                const { done, total } = goalMonthProgress(month)
                return (
                  <View key={month.id} className="overflow-hidden rounded-xl border border-border">
                    <Pressable
                      onPress={() => setOpenMonthId(open ? null : month.id)}
                      className="flex-row items-center justify-between bg-secondary/50 px-3.5 py-2.5 active:opacity-80"
                    >
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-semibold">{formatMonthLabel(month.month)}</Text>
                        <Text className="text-xs text-muted-foreground">
                          {done}/{total} 天
                        </Text>
                      </View>
                      <ChevronDown
                        size={16}
                        strokeWidth={2}
                        className={cn('text-muted-foreground', open && 'rotate-180')}
                      />
                    </Pressable>

                    {open ? (
                      <View className="gap-1 px-3 py-2">
                        {month.days.map((day) => {
                          const completed = isGoalDayCompleted(day.status)
                          return (
                            <Pressable
                              key={day.id}
                              disabled={isSaving}
                              onPress={() => void onToggleDay(day.id, !completed)}
                              className="flex-row items-center gap-2.5 py-1.5 active:opacity-70"
                            >
                              {/* 勾选圆钮 */}
                              <View
                                className={cn(
                                  'h-5 w-5 items-center justify-center rounded-full',
                                  completed ? 'bg-primary' : 'border-[1.5px] border-zinc-300 bg-background'
                                )}
                              >
                                {completed ? <Check size={12} strokeWidth={3} className="text-primary-foreground" /> : null}
                              </View>
                              <Text className={cn('flex-1 text-sm', completed && 'text-muted-foreground line-through')}>
                                {day.title}
                              </Text>
                            </Pressable>
                          )
                        })}
                        {month.days.length === 0 ? (
                          <Text className="py-2 text-xs text-muted-foreground">该月还没有日计划</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </View>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
