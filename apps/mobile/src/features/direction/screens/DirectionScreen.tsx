import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import { BookOpen, Bot, Coffee, Flag, Footprints, Plus, Wallet, type LucideIcon } from 'lucide-react-native'
import { AppHeader } from '@/components/layout/AppHeader'
import { ChevronRight } from 'lucide-react-native'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { goalProgress, goalSortRank, goalStats } from '@/domain/direction/progress'
import { cn } from '@/lib/utils'
import type { GoalItem } from '@/services/api/goals'
import { GoalDetailSheet } from '../components/GoalDetailSheet'
import { GoalEditorSheet } from '../components/GoalEditorSheet'
import { useDirectionData } from '../hooks/useDirectionData'
import { useDirectionMutations } from '../hooks/useDirectionMutations'

/**
 * 分类 → 图标。
 * 数据库里没有 icon 字段，按分类名映射，未命中时用旗标兜底。
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  学习: BookOpen,
  AI: Bot,
  健康: Footprints,
  财务: Wallet,
  生活: Coffee
}

function resolveIcon(goal: GoalItem): LucideIcon {
  return (goal.categoryName && CATEGORY_ICONS[goal.categoryName]) || Flag
}

function GoalCard({ goal, onPress }: { goal: GoalItem; onPress: () => void }) {
  const percent = Math.round(goalProgress(goal) * 100)
  const Icon = resolveIcon(goal)

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
        <Text className="text-xs text-muted-foreground">{goal.description || '暂无描述'}</Text>
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
  const { goals, categories, isLoading, errors, refetch } = useDirectionData()
  const { createGoal, toggleGoalDay, isSaving } = useDirectionMutations()

  const [categoryId, setCategoryId] = useState<string>('all')
  const [detailGoalId, setDetailGoalId] = useState<string | null>(null)
  const [editorVisible, setEditorVisible] = useState(false)

  const stats = useMemo(() => goalStats(goals), [goals])

  // 排序：进行中按进度倒序在前，已完成随后，未开始最后
  const filteredGoals = useMemo(() => {
    const matched = goals.filter((goal) => categoryId === 'all' || goal.categoryId === categoryId)
    return [...matched].sort((a, b) => {
      const rankDiff = goalSortRank(a) - goalSortRank(b)
      if (rankDiff !== 0) return rankDiff
      return goalProgress(b) - goalProgress(a)
    })
  }, [goals, categoryId])

  const detailGoal = goals.find((goal) => goal.id === detailGoalId) ?? null

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

      {/* 分类筛选（来自 goal_categories 表） */}
      <View className="flex-row flex-wrap gap-2 px-5 py-2">
        {[{ id: 'all', name: '全部' }, ...categories].map((category) => {
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

      {errors.length > 0 ? (
        <Card className="mx-5 mb-2 border-destructive/20 bg-destructive/5 py-0 shadow-none">
          <CardContent className="flex-row items-center justify-between px-3 py-2.5">
            <Text className="font-semibold text-danger">目标数据加载失败</Text>
            <Button onPress={refetch} size="sm" variant="ghost">
              <Text className="text-danger">重试</Text>
            </Button>
          </CardContent>
        </Card>
      ) : null}

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

        {isLoading ? <ActivityIndicator className="py-6" /> : null}

        {/* 目标卡片列表 */}
        <View className="gap-3 px-5">
          {filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onPress={() => setDetailGoalId(goal.id)} />
          ))}
          {!isLoading && filteredGoals.length === 0 ? (
            <Text className="py-10 text-center text-sm text-muted-foreground">该分类下暂无目标</Text>
          ) : null}
        </View>
      </ScrollView>

      <GoalDetailSheet
        goal={detailGoal}
        isSaving={isSaving}
        onToggleDay={(goalDayId, completed) => toggleGoalDay({ goalDayId, completed })}
        onClose={() => setDetailGoalId(null)}
      />

      <GoalEditorSheet
        visible={editorVisible}
        categories={categories}
        isSaving={isSaving}
        onClose={() => setEditorVisible(false)}
        onSave={async (input) => {
          await createGoal(input)
          setEditorVisible(false)
        }}
      />
    </SafeAreaView>
  )
}
