import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, View } from 'react-native'
import { ChevronDown } from 'lucide-react-native'
import { AppHeader } from '@/components/layout/AppHeader'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Text } from '@/components/ui/text'
import { formatCNDate, formatCNDateKey } from '@/domain/day/format'
import { toDateKey } from '@/domain/day/time'
import { cn } from '@/lib/utils'
import type { SummaryKind, SummaryRecord } from '@/services/api/summaries'
import { useDayExecutionItems } from '@/features/day/hooks/useDayExecutionItems'
import { useSummaryList, useSummaryByDate } from '../hooks/useSummaries'
import { useSummaryMutations } from '../hooks/useSummaryMutations'

const PERIODS = [
  { kind: 'daily', label: '日总结' },
  { kind: 'weekly', label: '周总结' },
  { kind: 'monthly', label: '月总结' },
  { kind: 'yearly', label: '年总结' }
] as const

// 总结卡片：点击展开阅读完整内容
function SummaryCard({ summary }: { summary: SummaryRecord }) {
  const [expanded, setExpanded] = useState(false)
  const isDaily = summary.kind === 'daily'

  return (
    <Pressable
      accessibilityLabel={`查看总结${summary.title}`}
      onPress={() => setExpanded((prev) => !prev)}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 active:opacity-90"
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-xs text-muted-foreground">{formatCNDateKey(summary.dateKey)}</Text>
          <Text className="text-base font-bold tracking-tight">{summary.title || '未命名总结'}</Text>
        </View>
        <ChevronDown size={18} strokeWidth={2} className={cn('text-muted-foreground', expanded && 'rotate-180')} />
      </View>

      {expanded ? (
        <View className="mt-3 gap-2 border-t border-border pt-3">
          {isDaily ? (
            <>
              <Text className="text-sm leading-6 text-foreground">今日感受：{summary.content.done || '—'}</Text>
              <Text className="text-sm leading-6 text-muted-foreground">改进之处：{summary.content.improve || '—'}</Text>
              <Text className="text-sm leading-6 text-muted-foreground">明日计划：{summary.content.tomorrow || '—'}</Text>
              <Text className="text-sm text-muted-foreground">今日心情：{summary.content.mood || '—'} / 5</Text>
            </>
          ) : (
            <Text className="text-sm leading-6 text-foreground">{summary.content.text || '—'}</Text>
          )}
        </View>
      ) : null}
    </Pressable>
  )
}

// 总结回顾页：周期切换 + 历史列表 + 日总结编辑卡（含自动聚合预填）
export function SummaryScreen() {
  const [period, setPeriod] = useState<SummaryKind>('daily')
  const today = useMemo(() => new Date(), [])
  const todayKey = toDateKey(today)

  const { summaries, isLoading } = useSummaryList(period)
  const { summary: todaySummary } = useSummaryByDate(todayKey, 'daily')
  const { saveSummary, isSaving } = useSummaryMutations()

  // 当日执行数据：用于无总结时自动生成预填文案（对齐 web 端自动聚合）
  const { scheduledItems, unscheduledItems, isLoading: isDayLoading } = useDayExecutionItems(today)
  const dayItems = [...scheduledItems, ...unscheduledItems]
  const doneCount = dayItems.filter((item) => item.completed).length
  const habitDoneCount = dayItems.filter((item) => item.source === 'habit' && item.completed).length
  const dataReady = !isDayLoading

  // 编辑卡字段
  const [feeling, setFeeling] = useState('')
  const [improvement, setImprovement] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [mood, setMood] = useState(3)
  const [saved, setSaved] = useState(false)
  const [prefillKeyApplied, setPrefillKeyApplied] = useState<string | null>(null)

  const prefillKey = `${todayKey}:${todaySummary?.id ?? 'new'}`

  useEffect(() => {
    if (todaySummary) {
      setFeeling(todaySummary.content.done ?? '')
      setImprovement(todaySummary.content.improve ?? '')
      setTomorrow(todaySummary.content.tomorrow ?? '')
      const parsedMood = Number(todaySummary.content.mood)
      setMood(Number.isFinite(parsedMood) && parsedMood >= 1 && parsedMood <= 5 ? parsedMood : 3)
      setPrefillKeyApplied(prefillKey)
      return
    }

    // 当天还没有总结：等执行数据就绪后生成一次预填，之后不再覆盖用户输入
    if (!dataReady || prefillKeyApplied === prefillKey) return

    setFeeling(`今日完成 ${doneCount}/${dayItems.length} 项任务，习惯打卡 ${habitDoneCount} 个。`)
    setImprovement('')
    setTomorrow('')
    setMood(3)
    setPrefillKeyApplied(prefillKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillKey, dataReady])

  async function handleSave() {
    const title = feeling.trim().split('\n')[0].slice(0, 30) || `${formatCNDate(today)} 总结`

    await saveSummary({
      summaryId: todaySummary?.id ?? null,
      input: {
        kind: 'daily',
        dateKey: todayKey,
        title,
        content: {
          done: feeling.trim(),
          improve: improvement.trim(),
          tomorrow: tomorrow.trim(),
          mood: String(mood)
        }
      }
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleCancel() {
    setFeeling(todaySummary?.content.done ?? '')
    setImprovement(todaySummary?.content.improve ?? '')
    setTomorrow(todaySummary?.content.tomorrow ?? '')
    const parsedMood = Number(todaySummary?.content.mood)
    setMood(Number.isFinite(parsedMood) && parsedMood >= 1 && parsedMood <= 5 ? parsedMood : 3)
  }

  const list = useMemo(
    () => [...summaries].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
    [summaries]
  )

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
          {isLoading ? <ActivityIndicator className="py-6" /> : null}

          {list.map((summary) => (
            <SummaryCard key={summary.id} summary={summary} />
          ))}

          {!isLoading && list.length === 0 ? (
            <Text className="py-10 text-center text-sm text-muted-foreground">
              暂无{PERIODS.find((p) => p.kind === period)?.label}
            </Text>
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
              <Button className="h-12 flex-1 rounded-xl" disabled={isSaving} onPress={() => void handleSave()}>
                <Text>{isSaving ? '保存中…' : '保存今日总结'}</Text>
              </Button>
            </View>
            {saved ? <Text className="pt-2 text-center text-sm text-success">已保存</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}
