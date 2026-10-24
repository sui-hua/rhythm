import { View } from 'react-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import {
  habitHeatmap,
  habitStatusText,
  habitStreak,
  habitTotalCount,
  habitWeekCount,
  toDateKey,
  type MockHabit
} from '@/mocks/data'
import { useMockStore } from '@/mocks/store'

const HEATMAP_WEEKS = 15

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className="text-lg font-extrabold tracking-tight">{value}</Text>
      <Text className="text-xs text-muted-foreground">{label}</Text>
    </View>
  )
}

// 习惯详情：统计 + 打卡热力图 + 今日打卡切换
export function HabitDetailSheet({ habit, onClose }: { habit: MockHabit | null; onClose: () => void }) {
  const habitLogs = useMockStore((state) => state.habitLogs)
  const toggleHabitCheckin = useMockStore((state) => state.toggleHabitCheckin)

  const today = new Date()
  const todayKey = toDateKey(today)
  const checkedToday = habit ? Boolean(habitLogs[`${habit.id}:${todayKey}`]) : false
  const heatmap = habit ? habitHeatmap(habit.id, habitLogs, today, HEATMAP_WEEKS) : []

  return (
    <Dialog open={Boolean(habit)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl">
        {habit ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-left text-xl font-bold tracking-tight">{habit.title}</DialogTitle>
              <Text className="text-sm text-muted-foreground">{habit.description}</Text>
            </DialogHeader>

            {/* 统计行 */}
            <View className="flex-row items-center rounded-2xl border border-border bg-card px-2 py-3">
              <Stat label="已坚持" value={`${habitStreak(habit.id, habitLogs, today)} 天`} />
              <View className="h-8 w-px bg-border" />
              <Stat label="累计" value={`${habitTotalCount(habit.id, habitLogs)} 次`} />
              <View className="h-8 w-px bg-border" />
              <Stat label="本周" value={`${habitWeekCount(habit.id, habitLogs, today)} 次`} />
            </View>

            {/* 打卡热力图：近 15 周，列为周、行为星期 */}
            <View className="gap-2">
              <Text className="text-sm font-semibold">打卡热力图</Text>
              <View className="flex-row gap-[3px]">
                {heatmap.map((column, columnIndex) => (
                  <View key={columnIndex} className="gap-[3px]">
                    {column.map((cell) => (
                      <View
                        key={cell.dateKey}
                        className={cn(
                          'h-[13px] w-[13px] rounded-[3px]',
                          cell.logged ? 'bg-primary' : cell.future ? 'bg-muted/40' : 'bg-muted'
                        )}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <Button className="h-12 rounded-xl" onPress={() => toggleHabitCheckin(habit.id, todayKey)}>
              <Text className="text-base font-semibold">{checkedToday ? '取消今日打卡' : '今日打卡'}</Text>
            </Button>
            <Text className="text-center text-xs text-muted-foreground">{habitStatusText(habit, habitLogs, today)}</Text>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
