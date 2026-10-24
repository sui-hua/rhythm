import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Check, ChevronDown } from 'lucide-react-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { goalProgress, type MockGoal } from '@/mocks/data'
import { useMockStore } from '@/mocks/store'

// 目标详情：总进度 + 月度 → 日计划两级展开，日计划可直接勾选
export function GoalDetailSheet({ goal, onClose }: { goal: MockGoal | null; onClose: () => void }) {
  const dayOverrides = useMockStore((state) => state.goalDayOverrides)
  const toggleGoalDay = useMockStore((state) => state.toggleGoalDay)
  // 默认展开第一个月
  const [openMonthId, setOpenMonthId] = useState<string | null>(goal?.months[0]?.id ?? null)

  const percent = goal ? Math.round(goalProgress(goal, dayOverrides) * 100) : 0

  function handleOpenChange(open: boolean) {
    if (!open) {
      setOpenMonthId(goal?.months[0]?.id ?? null)
      onClose()
    }
  }

  return (
    <Dialog open={Boolean(goal)} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl">
        {goal ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-left text-xl font-bold tracking-tight">{goal.title}</DialogTitle>
              <View className="flex-row items-center gap-2">
                <Badge variant="secondary" className="rounded-md">
                  <Text className="text-[11px] font-semibold text-secondary-foreground">
                    {goal.status === 'completed' ? '已完成' : percent > 0 ? '进行中' : '待开始'}
                  </Text>
                </Badge>
                <Text className="text-sm text-muted-foreground">{goal.description}</Text>
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
                const done = month.days.filter((day) => dayOverrides[day.id] ?? day.done).length
                return (
                  <View key={month.id} className="overflow-hidden rounded-xl border border-border">
                    <Pressable
                      onPress={() => setOpenMonthId(open ? null : month.id)}
                      className="flex-row items-center justify-between bg-secondary/50 px-3.5 py-2.5 active:opacity-80"
                    >
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-semibold">{month.label}</Text>
                        <Text className="text-xs text-muted-foreground">
                          {done}/{month.days.length} 天
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
                          const done = dayOverrides[day.id] ?? day.done
                          return (
                            <Pressable
                              key={day.id}
                              onPress={() => toggleGoalDay(day.id)}
                              className="flex-row items-center gap-2.5 py-1.5 active:opacity-70"
                            >
                              {/* 勾选圆钮 */}
                              <View
                                className={cn(
                                  'h-5 w-5 items-center justify-center rounded-full',
                                  done ? 'bg-primary' : 'border-[1.5px] border-zinc-300 bg-background'
                                )}
                              >
                                {done ? <Check size={12} strokeWidth={3} className="text-primary-foreground" /> : null}
                              </View>
                              <Text className={cn('flex-1 text-sm', done && 'text-muted-foreground line-through')}>
                                {day.title}
                              </Text>
                            </Pressable>
                          )
                        })}
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
