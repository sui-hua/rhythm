import { useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import { ChevronRight, Plus } from 'lucide-react-native'
import { AppHeader } from '@/components/layout/AppHeader'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { habitStatusText, toDateKey } from '@/mocks/data'
import { useMockStore } from '@/mocks/store'
import { HabitDetailSheet } from '../components/HabitDetailSheet'
import { HabitEditorSheet } from '../components/HabitEditorSheet'
import type { MockHabit } from '@/mocks/data'

// 习惯页：今日完成统计 + 习惯卡片列表 + 打卡详情与新建入口
export function HabitsScreen() {
  const habits = useMockStore((state) => state.habits)
  const habitLogs = useMockStore((state) => state.habitLogs)
  const [detailHabit, setDetailHabit] = useState<MockHabit | null>(null)
  const [editorVisible, setEditorVisible] = useState(false)

  const todayKey = toDateKey(new Date())
  // 今日已完成习惯数
  const doneToday = useMemo(
    () => habits.filter((habit) => habitLogs[`${habit.id}:${todayKey}`]).length,
    [habits, habitLogs, todayKey]
  )

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="习惯" />

      {/* 今日完成统计 */}
      <View className="px-5 pb-3 pt-1">
        <Text className="text-sm text-muted-foreground">
          今日已完成 <Text className="text-base font-bold text-foreground">{doneToday}</Text> 个习惯
        </Text>
      </View>

      {/* 习惯卡片列表 */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
        <View className="gap-3 px-5">
          {habits.map((habit) => (
            <Pressable
              key={habit.id}
              accessibilityLabel={`查看习惯${habit.title}`}
              onPress={() => setDetailHabit(habit)}
              className="flex-row items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 active:opacity-90"
            >
              <View className="flex-1 gap-1.5">
                <Text className="text-lg font-bold tracking-tight">{habit.title}</Text>
                <Text className="text-sm text-muted-foreground">{habit.description}</Text>
                <Text className="text-sm font-semibold text-success">{habitStatusText(habit, habitLogs, new Date())}</Text>
              </View>
              <ChevronRight size={20} strokeWidth={2} className="text-muted-foreground" />
            </Pressable>
          ))}
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

      <HabitDetailSheet habit={detailHabit} onClose={() => setDetailHabit(null)} />
      <HabitEditorSheet visible={editorVisible} onClose={() => setEditorVisible(false)} />
    </SafeAreaView>
  )
}
