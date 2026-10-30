import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import { ChevronRight, Plus } from 'lucide-react-native'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import type { HabitRecord } from '@/domain/day/types'
import { formatHabitFrequency, habitStatusText, hasLogOn } from '@/domain/habits/stats'
import { cn } from '@/lib/utils'
import { HabitDetailSheet } from '../components/HabitDetailSheet'
import { HabitEditorSheet } from '../components/HabitEditorSheet'
import { useHabitMutations } from '../hooks/useHabitMutations'
import { useHabits } from '../hooks/useHabits'

// 习惯页：今日完成统计 + 习惯卡片列表 + 打卡详情与新建入口
export function HabitsScreen() {
  const { habits, logIndex, isLoading, errors, refetch } = useHabits()
  const { createHabit, toggleHabit, isSaving } = useHabitMutations()

  const [detailHabitId, setDetailHabitId] = useState<string | null>(null)
  const [editorVisible, setEditorVisible] = useState(false)

  const today = useMemo(() => new Date(), [])
  const doneToday = habits.filter((habit) => hasLogOn(logIndex, habit.id, today)).length
  const detailHabit = habits.find((habit) => habit.id === detailHabitId) ?? null

  async function handleToggle(habit: HabitRecord, checked: boolean) {
    await toggleHabit({ habitId: habit.id, date: today, checked })
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="习惯" />

      {/* 今日完成统计 */}
      <View className="px-5 pb-3 pt-1">
        <Text className="text-sm text-muted-foreground">
          今日已完成 <Text className="text-base font-bold text-foreground">{doneToday}</Text> 个习惯
        </Text>
      </View>

      {errors.length > 0 ? (
        <Card className="mx-5 mb-2 border-destructive/20 bg-destructive/5 py-0 shadow-none">
          <CardContent className="flex-row items-center justify-between px-3 py-2.5">
            <Text className="font-semibold text-danger">习惯数据加载失败</Text>
            <Button onPress={refetch} size="sm" variant="ghost">
              <Text className="text-danger">重试</Text>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* 习惯卡片列表 */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
        {isLoading ? <ActivityIndicator className="py-6" /> : null}

        <View className="gap-3 px-5">
          {habits.map((habit) => (
            <Pressable
              key={habit.id}
              accessibilityLabel={`查看习惯${habit.title}`}
              onPress={() => setDetailHabitId(habit.id)}
              className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 active:opacity-90"
            >
              <View className="flex-1 gap-1.5">
                <Text className="text-lg font-bold tracking-tight">{habit.title}</Text>
                <Text className="text-sm text-muted-foreground">
                  {formatHabitFrequency(habit.frequency)}
                  {habit.targetValue ? ` · 目标 ${habit.targetValue}` : ''}
                </Text>
                <Text className="text-sm font-semibold text-success">{habitStatusText(habit, logIndex, today)}</Text>
              </View>
              <ChevronRight size={20} strokeWidth={2} className="text-muted-foreground" />
            </Pressable>
          ))}

          {!isLoading && habits.length === 0 ? (
            <Text className="py-10 text-center text-sm text-muted-foreground">还没有习惯，点右下角新建一个</Text>
          ) : null}
        </View>
      </ScrollView>

      {/* 新建习惯悬浮按钮 */}
      <Pressable
        accessibilityLabel="新建习惯"
        onPress={() => setEditorVisible(true)}
        className={cn('absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-black/25 active:bg-primary/90')}
      >
        <Plus size={26} strokeWidth={2.5} className="text-primary-foreground" />
      </Pressable>

      <HabitDetailSheet
        habit={detailHabit}
        logIndex={logIndex}
        today={today}
        isSaving={isSaving}
        onToggle={handleToggle}
        onClose={() => setDetailHabitId(null)}
      />

      <HabitEditorSheet
        visible={editorVisible}
        isSaving={isSaving}
        onClose={() => setEditorVisible(false)}
        onSave={async (input) => {
          await createHabit(input)
          setEditorVisible(false)
        }}
      />
    </SafeAreaView>
  )
}
