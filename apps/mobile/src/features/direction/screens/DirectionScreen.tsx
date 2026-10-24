import { useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import { BookOpen, Bot, Coffee, Flag, Footprints, Plus, Wallet, type LucideIcon } from 'lucide-react-native'
import { AppHeader } from '@/components/layout/AppHeader'
import { ChevronRight } from 'lucide-react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { CATEGORIES, goalProgress, goalStats, type MockGoal } from '@/mocks/data'
import { useMockStore } from '@/mocks/store'
import { GoalDetailSheet } from '../components/GoalDetailSheet'
import { GoalEditorSheet } from '../components/GoalEditorSheet'

// 目标图标映射：黑底白图与设计稿一致
const GOAL_ICONS: Record<MockGoal['icon'], LucideIcon> = {
  book: BookOpen,
  run: Footprints,
  bot: Bot,
  wallet: Wallet,
  coffee: Coffee,
  flag: Flag
}

function GoalCard({ goal, onPress }: { goal: MockGoal; onPress: () => void }) {
  const dayOverrides = useMockStore((state) => state.goalDayOverrides)
  const percent = Math.round(goalProgress(goal, dayOverrides) * 100)
  const Icon = GOAL_ICONS[goal.icon]

  return (
    <Pressable
      accessibilityLabel={`查看目标${goal.title}`}
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 active:opacity-90"
    >
      <View className="h-12 w-12 items-center justify-center rounded-xl bg-primary">
        <Icon size={22} strokeWidth={2} className="text-primary-foreground" />
      </View>

      <View className="flex-1 gap-2">
        <Text className="text-[15px] font-bold tracking-tight">{goal.title}</Text>
        <Text className="text-xs text-muted-foreground">{goal.description}</Text>
        {/* 进度条：黑条落在 zinc 底轨上 */}
        <View className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <View className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </View>
      </View>

      <View className="flex-row items-center gap-1.5">
        <Text className="text-lg font-extrabold tracking-tight">{percent}%</Text>
        <ChevronRight size={18} strokeWidth={2} className="text-muted-foreground" />
      </View>
    </Pressable>
  )
}

// 方向页：分类筛选 + 目标统计 + 目标卡片列表 + 新建入口
export function DirectionScreen() {
  const goals = useMockStore((state) => state.goals)
  const dayOverrides = useMockStore((state) => state.goalDayOverrides)
  const [categoryId, setCategoryId] = useState<string>('all')
  const [detailGoal, setDetailGoal] = useState<MockGoal | null>(null)
  const [editorVisible, setEditorVisible] = useState(false)

  const stats = useMemo(() => goalStats(goals, dayOverrides), [goals, dayOverrides])
  // 排序：进行中按进度倒序在前，已完成随后，未开始最后
  const filteredGoals = useMemo(() => {
    const matched = goals.filter((goal) => categoryId === 'all' || goal.categoryId === categoryId)
    return [...matched].sort((a, b) => {
      const rank = (goal: MockGoal) => (goal.status === 'completed' ? 1 : 0) * 2 + (goalProgress(goal, dayOverrides) > 0 ? 0 : 1)
      return rank(a) - rank(b)
    })
  }, [goals, categoryId, dayOverrides])

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader
        title="方向"
        right={
          <Pressable accessibilityLabel="新建目标" onPress={() => setEditorVisible(true)} className="active:opacity-60">
            <Plus size={24} strokeWidth={2} className="text-foreground" />
          </Pressable>
        }
      />

      {/* 分类筛选（当前分类数量在一屏内，直接平铺） */}
      <View className="flex-row flex-wrap gap-2 px-5 py-2">
        {[{ id: 'all', name: '全部' }, ...CATEGORIES].map((category) => {
          const active = categoryId === category.id
          return (
            <Pressable
              key={category.id}
              onPress={() => setCategoryId(category.id)}
              className={cn(
                'rounded-full px-4 py-2',
                active ? 'bg-primary' : 'bg-secondary active:bg-secondary/80'
              )}
            >
              <Text className={cn('text-sm font-semibold', active ? 'text-primary-foreground' : 'text-secondary-foreground')}>
                {category.name}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
        {/* 状态统计卡 */}
        <View className="mx-5 mt-2 flex-row items-center rounded-2xl border border-border bg-card py-4 shadow-sm shadow-black/5">
          <View className="flex-1 items-center gap-1">
            <Text className="text-2xl font-extrabold tracking-tight">{stats.completed}</Text>
            <Text className="text-xs text-muted-foreground">已完成</Text>
          </View>
          <View className="h-10 w-px bg-border" />
          <View className="flex-1 items-center gap-1">
            <Text className="text-2xl font-extrabold tracking-tight">{stats.inProgress}</Text>
            <Text className="text-xs text-muted-foreground">进行中</Text>
          </View>
          <View className="h-10 w-px bg-border" />
          <View className="flex-1 items-center gap-1">
            <Text className="text-2xl font-extrabold tracking-tight">{stats.notStarted}</Text>
            <Text className="text-xs text-muted-foreground">待开始</Text>
          </View>
        </View>

        <Text className="px-5 pb-2 pt-5 text-base font-bold tracking-tight">我的目标</Text>

        {/* 目标卡片列表 */}
        <View className="gap-3 px-5">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onPress={() => setDetailGoal(goal)} />
          ))}
          {filteredGoals.length === 0 ? (
            <Text className="py-10 text-center text-sm text-muted-foreground">该分类下暂无目标</Text>
          ) : null}
        </View>
      </ScrollView>

      <GoalDetailSheet goal={detailGoal} onClose={() => setDetailGoal(null)} />
      <GoalEditorSheet visible={editorVisible} onClose={() => setEditorVisible(false)} />
    </SafeAreaView>
  )
}
