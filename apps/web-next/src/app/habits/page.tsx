'use client'

import { useMemo, useState } from 'react'
import { createHabit, createHabitLog, deleteHabitLog, listHabitLogsBetween, listHabits } from '@/lib/api'
import type { HabitFrequency, HabitRecord } from '@/lib/api'
import { addDays, getWeekStart } from '@/lib/date'
import {
  buildHabitLogIndex,
  formatHabitFrequency,
  habitHeatmap,
  habitStatusText,
  habitStreak,
  habitTotalCount,
  habitWeekCount,
  hasLogOn
} from '@/lib/habit-stats'
import { useAsyncData } from '@/lib/use-async-data'
import { Button, Card, ClientOnly, EmptyState, ErrorBanner, SectionTitle, cn } from '@/components/ui'

const HEATMAP_WEEKS = 15

type FrequencyKind = HabitFrequency['type']

const FREQUENCY_OPTIONS: Array<{ value: FrequencyKind; label: string }> = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周一三五' },
  { value: 'monthly', label: '每月 1 日' }
]

function buildFrequency(kind: FrequencyKind): HabitFrequency {
  if (kind === 'weekly') return { type: 'weekly', weekdays: [1, 3, 5] }
  if (kind === 'monthly') return { type: 'monthly', monthDays: [1] }
  return { type: 'daily' }
}

export default function HabitsPage() {
  return (
    <ClientOnly fallback={<p className="py-10 text-center text-sm text-muted-foreground">加载中…</p>}>
      <HabitsView />
    </ClientOnly>
  )
}

function HabitsView() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [targetValue, setTargetValue] = useState('1')
  const [frequencyKind, setFrequencyKind] = useState<FrequencyKind>('daily')
  const [creating, setCreating] = useState(false)

  const today = useMemo(() => new Date(), [])

  const range = useMemo(() => {
    const start = addDays(getWeekStart(today), -7 * (HEATMAP_WEEKS - 1))
    start.setHours(0, 0, 0, 0)
    const end = new Date(today)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [today])

  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [habits, logs] = await Promise.all([
        listHabits(),
        listHabitLogsBetween(range.start, range.end)
      ])
      return { habits, logs }
    },
    []
  )

  const habits = data?.habits ?? []
  const logs = data?.logs ?? []
  const logIndex = useMemo(() => buildHabitLogIndex(logs), [logs])

  const selected = habits.find((habit) => habit.id === selectedId) ?? null
  const doneToday = habits.filter((habit) => hasLogOn(logIndex, habit.id, today)).length

  async function handleToggle(habit: HabitRecord) {
    setBusyId(habit.id)

    try {
      if (hasLogOn(logIndex, habit.id, today)) {
        const log = logs.find((entry) => entry.habitId === habit.id)
        if (log) await deleteHabitLog(log.id)
      } else {
        await createHabitLog(habit.id, new Date())
      }

      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim() || creating) return

    setCreating(true)

    try {
      const parsed = Number(targetValue)
      await createHabit({
        title,
        frequency: buildFrequency(frequencyKind),
        targetValue: Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1
      })
      setTitle('')
      setTargetValue('1')
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">习惯</p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          今日已完成 <span className="text-2xl">{doneToday}</span> 个习惯
        </h1>
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {loading ? <EmptyState>加载中…</EmptyState> : null}

      <div className="space-y-2">
        {habits.map((habit) => {
          const checked = hasLogOn(logIndex, habit.id, today)

          return (
            <Card key={habit.id} className="flex items-center gap-3 p-3.5">
              <button
                type="button"
                aria-label={`${checked ? '取消打卡' : '打卡'}${habit.title}`}
                onClick={() => void handleToggle(habit)}
                disabled={busyId === habit.id}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] transition',
                  checked
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:border-muted-foreground'
                )}
              >
                {checked ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M4 12.5 9.5 18 20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setSelectedId(habit.id === selectedId ? null : habit.id)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-bold">{habit.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatHabitFrequency(habit.frequency)}
                  {habit.targetValue ? ` · 目标 ${habit.targetValue}` : ''}
                </p>
              </button>

              <span className={cn('text-xs font-semibold', checked ? 'text-success' : 'text-muted-foreground')}>
                {habitStatusText(habit, logIndex, today)}
              </span>
            </Card>
          )
        })}

        {!loading && habits.length === 0 ? <EmptyState>还没有习惯，先在下面建一个</EmptyState> : null}
      </div>

      {/* 详情：统计 + 热力图 */}
      {selected ? (
        <div>
          <SectionTitle extra={<Button variant="ghost" onClick={() => setSelectedId(null)}>收起</Button>}>
            {selected.title}
          </SectionTitle>
          <Card className="space-y-4">
            <div className="grid grid-cols-3 divide-x divide-border text-center">
              <div>
                <p className="text-lg font-extrabold">{habitStreak(logIndex, selected.id, today)} 天</p>
                <p className="text-xs text-muted-foreground">已坚持</p>
              </div>
              <div>
                <p className="text-lg font-extrabold">{habitTotalCount(logIndex, selected.id)} 次</p>
                <p className="text-xs text-muted-foreground">累计</p>
              </div>
              <div>
                <p className="text-lg font-extrabold">{habitWeekCount(logIndex, selected.id, today)} 次</p>
                <p className="text-xs text-muted-foreground">本周</p>
              </div>
            </div>

            <div>
              <p className="pb-2 text-sm font-semibold">打卡热力图</p>
              <div className="flex gap-[3px] overflow-x-auto">
                {habitHeatmap(logIndex, selected.id, today, HEATMAP_WEEKS).map((column, columnIndex) => (
                  <div key={columnIndex} className="flex flex-col gap-[3px]">
                    {column.map((cell) => (
                      <div
                        key={cell.dateKey}
                        title={`${cell.dateKey}${cell.logged ? ' 已打卡' : ''}`}
                        className={cn(
                          'h-[13px] w-[13px] rounded-[3px]',
                          cell.logged ? 'bg-primary' : cell.future ? 'bg-muted/40' : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {/* 新建习惯 */}
      <div>
        <SectionTitle>新建习惯</SectionTitle>
        <Card>
          <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              className="field flex-1"
              placeholder="习惯名称，例如：每天喝水"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <select
              className="field sm:w-36"
              value={frequencyKind}
              onChange={(event) => setFrequencyKind(event.target.value as FrequencyKind)}
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              className="field sm:w-24"
              type="number"
              min={1}
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
            />
            <Button type="submit" disabled={creating || !title.trim()}>
              {creating ? '创建中…' : '添加'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
