import { useEffect, useMemo, useState } from 'react'
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'
import { formatCNDate, toDateKey, WEEKDAY_CN, type MockSummary } from '@/mocks/data'
import { useMockStore } from '@/mocks/store'

const PERIODS = [
  { kind: 'daily', label: '日总结' },
  { kind: 'weekly', label: '周总结' },
  { kind: 'monthly', label: '月总结' },
  { kind: 'yearly', label: '年总结' }
] as const

type PeriodKind = (typeof PERIODS)[number]['kind']

function formatSummaryDate(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00`)
  return `${formatCNDate(date)} ${WEEKDAY_CN[date.getDay()]}`
}

// 总结列表卡片：点击展开阅读完整字段
function SummaryCard({ summary }: { summary: MockSummary }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Pressable
      accessibilityLabel={`查看总结${summary.title}`}
      onPress={() => setExpanded((prev) => !prev)}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 active:opacity-90"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-xs text-muted-foreground">{formatSummaryDate(summary.dateKey)}</Text>
          <Text className="text-base font-bold tracking-tight">{summary.title}</Text>
        </View>
        <ChevronDown size={18} strokeWidth={2} className={cn('text-muted-foreground', expanded && 'rotate-180')} />
      </View>

      {expanded ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          <Text className="text-sm leading-6 text-foreground">今日感受：{summary.feeling || '—'}</Text>
          <Text className="text-sm leading-6 text-muted-foreground">改进之处：{summary.improvement || '—'}</Text>
          <Text className="text-sm leading-6 text-muted-foreground">明日计划：{summary.tomorrow || '—'}</Text>
          <Text className="text-sm text-muted-foreground">今日心情：{summary.mood} / 5</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

// 总结回顾页：周期切换 + 历史列表 + 日总结编辑卡（含自动聚合预填）
export function SummaryScreen() {
  const summaries = useMockStore((state) => state.summaries)
  const saveSummary = useMockStore((state) => state.saveSummary)
  const tasks = useMockStore((state) => state.tasks)
  const habits = useMockStore((state) => state.habits)
  const habitLogs = useMockStore((state) => state.habitLogs)
  const taskOverrides = useMockStore((state) => state.taskOverrides)

  const [period, setPeriod] = useState<PeriodKind>('daily')
  const todayKey = toDateKey(new Date())
  const todaySummary = useMemo(() => summaries.find((item) => item.kind === 'daily' && item.dateKey === todayKey), [summaries, todayKey])

  // 编辑卡字段
  const [feeling, setFeeling] = useState('')
  const [improvement, setImprovement] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [mood, setMood] = useState(3)
  const [saved, setSaved] = useState(false)

  // 自动聚合：进入页面时若今日无总结，用当日执行数据生成预填文案（对齐 Web 端自动聚合）
  useEffect(() => {
    if (todaySummary) {
      setFeeling(todaySummary.feeling)
      setImprovement(todaySummary.improvement)
      setTomorrow(todaySummary.tomorrow)
      setMood(todaySummary.mood)
      return
    }
    const todayTasks = tasks.filter((task) => task.dateKey === todayKey)
    const done = todayTasks.filter((task) => taskOverrides[`task:${todayKey}:${task.id}`] ?? task.completed).length
    const habitDone = habits.filter((habit) => habitLogs[`${habit.id}:${todayKey}`]).length
    setFeeling(`今日完成 ${done}/${todayTasks.length} 项任务，习惯打卡 ${habitDone} 个。`)
    setImprovement('')
    setTomorrow('')
    setMood(3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaySummary?.id])

  function handleSave() {
    const next: MockSummary = {
      id: todaySummary?.id ?? `s-daily-${todayKey}`,
      kind: 'daily',
      dateKey: todayKey,
      title: feeling.trim().split('\n')[0].slice(0, 30) || `${formatCNDate(new Date())} 总结`,
      feeling: feeling.trim(),
      improvement: improvement.trim(),
      tomorrow: tomorrow.trim(),
      mood
    }
    saveSummary(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCancel() {
    setFeeling(todaySummary?.feeling ?? '')
    setImprovement(todaySummary?.improvement ?? '')
    setTomorrow(todaySummary?.tomorrow ?? '')
    setMood(todaySummary?.mood ?? 3)
  }

  const list = summaries
    .filter((item) => item.kind === period)
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AppHeader title="总结回顾" />

      {/* 周期切换 */}
      <View className="flex-row gap-2 px-5 py-2">
        {PERIODS.map((item) => {
          const active = period === item.kind
          return (
            <Pressable
              key={item.kind}
              onPress={() => setPeriod(item.kind)}
              className={cn('flex-1 rounded-full py-2', active ? 'bg-primary' : 'bg-secondary active:bg-secondary/80')}
            >
              <Text className={cn('text-center text-sm font-semibold', active ? 'text-primary-foreground' : 'text-secondary-foreground')}>
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
        {/* 历史总结列表 */}
        <View className="gap-3 px-5 pt-2">
          {list.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} />
          ))}
          {list.length === 0 ? (
            <Text className="py-10 text-center text-sm text-muted-foreground">暂无{PERIODS.find((p) => p.kind === period)?.label}</Text>
          ) : null}
        </View>

        {/* 编辑总结：仅日总结提供，字段与设计稿一致 */}
        {period === 'daily' ? (
          <View className="mx-5 mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5">
            <Text className="text-lg font-bold tracking-tight">编辑总结</Text>
            <Text className="mt-1 text-sm text-muted-foreground">更新你的日常回顾，沉淀记录。</Text>

            <View className="mt-4 gap-2">
              <Text className="text-sm font-medium">今日感受</Text>
              <Textarea className="rounded-xl" placeholder="今天过得怎么样？" value={feeling} onChangeText={setFeeling} numberOfLines={3} />
            </View>
            <View className="mt-3 gap-2">
              <Text className="text-sm font-medium">改进之处</Text>
              <Textarea className="rounded-xl" placeholder="有哪些地方可以做得更好？" value={improvement} onChangeText={setImprovement} numberOfLines={2} />
            </View>
            <View className="mt-3 gap-2">
              <Text className="text-sm font-medium">明日计划</Text>
              <Textarea className="rounded-xl" placeholder="明天最优先处理的任务是什么？" value={tomorrow} onChangeText={setTomorrow} numberOfLines={2} />
            </View>

            <View className="mt-4 gap-2">
              <Text className="text-sm font-medium">今日心情</Text>
              <View className="flex-row gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = mood === value
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setMood(value)}
                      className={cn('h-9 flex-1 items-center justify-center rounded-full', active ? 'bg-primary' : 'bg-secondary active:bg-secondary/80')}
                    >
                      <Text className={cn('text-sm font-semibold', active ? 'text-primary-foreground' : 'text-secondary-foreground')}>
                        {value}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View className="mt-5 flex-row gap-3">
              <Button variant="secondary" className="h-12 flex-1 rounded-xl" onPress={handleCancel}>
                <Text>取消</Text>
              </Button>
              <Button className="h-12 flex-1 rounded-xl" onPress={handleSave}>
                <Text>保存今日总结</Text>
              </Button>
            </View>
            {saved ? <Text className="pt-2 text-center text-sm text-success">已保存</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
