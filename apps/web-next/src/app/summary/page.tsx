'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getSummaryByDate,
  listHabitLogsBetween,
  listSummaries,
  listTasksForDate,
  saveSummary
} from '@/lib/api'
import type { SummaryKind, SummaryRecord } from '@/lib/api'
import { formatCNDate, formatCNDateKey, toDateKey } from '@/lib/date'
import { useAsyncData } from '@/lib/use-async-data'
import { Button, Card, ClientOnly, EmptyState, ErrorBanner, SectionTitle, cn } from '@/components/ui'

const PERIODS: Array<{ kind: SummaryKind; label: string }> = [
  { kind: 'daily', label: '日总结' },
  { kind: 'weekly', label: '周总结' },
  { kind: 'monthly', label: '月总结' },
  { kind: 'yearly', label: '年总结' }
]

const MOODS = [1, 2, 3, 4, 5]

export default function SummaryPage() {
  return (
    <ClientOnly fallback={<p className="py-10 text-center text-sm text-muted-foreground">加载中…</p>}>
      <SummaryView />
    </ClientOnly>
  )
}

function SummaryView() {
  const [period, setPeriod] = useState<SummaryKind>('daily')
  const today = useMemo(() => new Date(), [])
  const todayKey = toDateKey(today)

  const dayRange = useMemo(() => {
    const start = new Date(today)
    start.setHours(0, 0, 0, 0)
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [today])

  // 列表随 period 变化；今日总结与当日执行数据只在日总结下需要
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [summaries, todaySummary, tasks, habitLogs] = await Promise.all([
        listSummaries(period),
        getSummaryByDate(todayKey, 'daily'),
        listTasksForDate(today),
        listHabitLogsBetween(dayRange.start, dayRange.end)
      ])

      return { summaries, todaySummary, tasks, habitLogs }
    },
    [period]
  )

  const summaries = data?.summaries ?? []
  const todaySummary = data?.todaySummary ?? null

  const [feeling, setFeeling] = useState('')
  const [improvement, setImprovement] = useState('')
  const [tomorrow, setTomorrow] = useState('')
  const [mood, setMood] = useState(3)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  // 有今日总结就回填；没有则用当日执行数据生成一次预填
  useEffect(() => {
    if (loading) return
    if (prefilled) return

    if (todaySummary) {
      setFeeling(todaySummary.content.done ?? '')
      setImprovement(todaySummary.content.improve ?? '')
      setTomorrow(todaySummary.content.tomorrow ?? '')
      const parsed = Number(todaySummary.content.mood)
      setMood(Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 3)
      setPrefilled(true)
      return
    }

    const tasks = data?.tasks ?? []
    const done = tasks.filter((task) => task.completed).length
    const habitDone = data?.habitLogs.length ?? 0

    setFeeling(`今日完成 ${done}/${tasks.length} 项任务，习惯打卡 ${habitDone} 个。`)
    setImprovement('')
    setTomorrow('')
    setMood(3)
    setPrefilled(true)
  }, [loading, prefilled, todaySummary, data])

  // 切换周期后允许重新预填
  useEffect(() => {
    setPrefilled(false)
  }, [todayKey])

  const sorted = useMemo(
    () => [...summaries].sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1)),
    [summaries]
  )

  async function handleSave() {
    if (saving) return
    setSaving(true)

    try {
      await saveSummary({
        id: todaySummary?.id ?? null,
        kind: 'daily',
        dateKey: todayKey,
        title: feeling.trim().split('\n')[0].slice(0, 30) || `${formatCNDate(today)} 总结`,
        content: {
          done: feeling.trim(),
          improve: improvement.trim(),
          tomorrow: tomorrow.trim(),
          mood: String(mood)
        }
      })

      setSaved(true)
      setPrefilled(false)
      reload()
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setFeeling(todaySummary?.content.done ?? '')
    setImprovement(todaySummary?.content.improve ?? '')
    setTomorrow(todaySummary?.content.tomorrow ?? '')
    const parsed = Number(todaySummary?.content.mood)
    setMood(Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 3)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">总结</p>
        <h1 className="text-2xl font-extrabold tracking-tight">总结回顾</h1>
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {/* 周期切换 */}
      <div className="flex gap-2">
        {PERIODS.map((item) => {
          const active = period === item.kind
          return (
            <button
              key={item.kind}
              type="button"
              onClick={() => setPeriod(item.kind)}
              className={cn(
                'flex-1 rounded-full py-2 text-sm font-semibold transition',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {/* 历史列表 */}
      <div className="space-y-2">
        {loading ? <EmptyState>加载中…</EmptyState> : null}

        {sorted.map((summary) => (
          <SummaryCard key={summary.id} summary={summary} />
        ))}

        {!loading && sorted.length === 0 ? (
          <EmptyState>暂无{PERIODS.find((item) => item.kind === period)?.label}</EmptyState>
        ) : null}
      </div>

      {/* 日总结编辑 */}
      {period === 'daily' ? (
        <div>
          <SectionTitle>编辑总结</SectionTitle>
          <Card className="space-y-3">
            <div>
              <label className="pb-1.5 text-sm font-medium">今日感受</label>
              <textarea
                className="field min-h-20"
                placeholder="今天过得怎么样？"
                value={feeling}
                onChange={(event) => setFeeling(event.target.value)}
              />
            </div>

            <div>
              <label className="pb-1.5 text-sm font-medium">改进之处</label>
              <textarea
                className="field min-h-16"
                placeholder="有哪些地方可以做得更好？"
                value={improvement}
                onChange={(event) => setImprovement(event.target.value)}
              />
            </div>

            <div>
              <label className="pb-1.5 text-sm font-medium">明日计划</label>
              <textarea
                className="field min-h-16"
                placeholder="明天最优先处理的任务是什么？"
                value={tomorrow}
                onChange={(event) => setTomorrow(event.target.value)}
              />
            </div>

            <div>
              <label className="pb-1.5 text-sm font-medium">今日心情</label>
              <div className="flex gap-2">
                {MOODS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMood(value)}
                    className={cn(
                      'h-9 flex-1 rounded-full text-sm font-semibold transition',
                      mood === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={handleCancel}>
                取消
              </Button>
              <Button className="flex-1" onClick={() => void handleSave()} disabled={saving}>
                {saving ? '保存中…' : '保存今日总结'}
              </Button>
            </div>

            {saved ? <p className="text-center text-sm text-success">已保存</p> : null}
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function SummaryCard({ summary }: { summary: SummaryRecord }) {
  const [expanded, setExpanded] = useState(false)
  const isDaily = summary.kind === 'daily'

  return (
    <Card className="p-0">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{formatCNDateKey(summary.dateKey)}</p>
          <p className="truncate text-sm font-bold">{summary.title || '未命名总结'}</p>
        </div>
        <span className={cn('text-muted-foreground transition', expanded && 'rotate-180')}>▾</span>
      </button>

      {expanded ? (
        <div className="space-y-1.5 border-t border-border px-4 py-3 text-sm">
          {isDaily ? (
            <>
              <p>今日感受：{summary.content.done || '—'}</p>
              <p className="text-muted-foreground">改进之处：{summary.content.improve || '—'}</p>
              <p className="text-muted-foreground">明日计划：{summary.content.tomorrow || '—'}</p>
              <p className="text-muted-foreground">今日心情：{summary.content.mood || '—'} / 5</p>
            </>
          ) : (
            <p>{summary.content.text || '—'}</p>
          )}
        </div>
      ) : null}
    </Card>
  )
}
