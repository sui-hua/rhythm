'use client'

import { useMemo, useState } from 'react'
import {
  createHabitLog,
  createTask,
  deleteHabitLog,
  listDailyPlansForDate,
  listHabitLogsBetween,
  listHabits,
  listTasksForDate,
  toggleDailyPlanComplete,
  toggleTaskComplete
} from '@/lib/api'
import type { DailyPlanRecord, HabitLogRecord, HabitRecord, TaskRecord } from '@/lib/api'
import { addDays, formatCNDate, formatIsoAsClock, parseClockToMinutes, toDateKey, WEEKDAY_CN } from '@/lib/date'
import { useAsyncData } from '@/lib/use-async-data'
import { Button, Card, CheckCircle, ClientOnly, EmptyState, ErrorBanner, ProgressBar, SectionTitle, StatusPill, cn } from '@/components/ui'

type DayItem = {
  id: string
  source: 'task' | 'plan' | 'habit'
  title: string
  detail: string
  minutes: number | null
  completed: boolean
}

const SOURCE_LABEL = {
  task: '个人任务',
  plan: '今日计划',
  habit: '日常习惯'
} as const

function buildItems(
  tasks: TaskRecord[],
  plans: DailyPlanRecord[],
  habits: HabitRecord[],
  logs: HabitLogRecord[]
): DayItem[] {
  const loggedHabitIds = new Set(logs.map((log) => log.habitId))
  const items: DayItem[] = []

  for (const task of tasks) {
    const clock = formatIsoAsClock(task.startAt)
    items.push({
      id: task.id,
      source: 'task',
      title: task.title,
      detail: clock ? `${clock}${task.notes ? ` · ${task.notes}` : ''}` : task.notes,
      minutes: clock ? parseClockToMinutes(`${clock}:00`) : null,
      completed: task.completed
    })
  }

  for (const plan of plans) {
    items.push({
      id: plan.id,
      source: 'plan',
      title: plan.title,
      detail: plan.taskTime ? plan.taskTime.slice(0, 5) : plan.description,
      minutes: parseClockToMinutes(plan.taskTime),
      completed: plan.status === 'completed'
    })
  }

  for (const habit of habits) {
    items.push({
      id: habit.id,
      source: 'habit',
      title: habit.title,
      detail: habit.taskTime ? habit.taskTime.slice(0, 5) : '未排时间',
      minutes: parseClockToMinutes(habit.taskTime),
      completed: loggedHabitIds.has(habit.id)
    })
  }

  return items.sort((a, b) => {
    if (a.minutes === null && b.minutes === null) return a.title.localeCompare(b.title)
    if (a.minutes === null) return 1
    if (b.minutes === null) return -1
    return a.minutes - b.minutes
  })
}

/** 把日期 + HH:mm 变成该时刻的 ISO 字符串 */
function isoAt(dateKey: string, clock: string): string {
  return new Date(`${dateKey}T${clock}:00`).toISOString()
}

export default function DayPage() {
  return (
    <ClientOnly fallback={<p className="py-10 text-center text-sm text-muted-foreground">加载中…</p>}>
      <DayView />
    </ClientOnly>
  )
}

function DayView() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const dateKey = toDateKey(currentDate)

  const dayRange = useMemo(() => {
    const start = new Date(currentDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(currentDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [dateKey])

  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [tasks, plans, habits, logs] = await Promise.all([
        listTasksForDate(currentDate),
        listDailyPlansForDate(dateKey),
        listHabits(),
        listHabitLogsBetween(dayRange.start, dayRange.end)
      ])
      return { tasks, plans, habits, logs }
    },
    [dateKey]
  )

  const [busyId, setBusyId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newClock, setNewClock] = useState('09:00')
  const [creating, setCreating] = useState(false)

  const items = useMemo(
    () => buildItems(data?.tasks ?? [], data?.plans ?? [], data?.habits ?? [], data?.logs ?? []),
    [data]
  )

  const completedCount = items.filter((item) => item.completed).length
  const percent = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100)

  async function handleToggle(item: DayItem) {
    setBusyId(item.id)

    try {
      if (item.source === 'task') {
        await toggleTaskComplete(item.id, !item.completed)
      } else if (item.source === 'plan') {
        await toggleDailyPlanComplete(item.id, !item.completed)
      } else if (item.completed) {
        const log = data?.logs.find((entry) => entry.habitId === item.id)
        if (log) await deleteHabitLog(log.id)
      } else {
        await createHabitLog(item.id, new Date())
      }

      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    } finally {
      setBusyId(null)
    }
  }

  async function handleCreateTask(event: React.FormEvent) {
    event.preventDefault()
    if (!newTitle.trim() || creating) return

    setCreating(true)

    try {
      const startAt = isoAt(dateKey, newClock)
      const endAt = new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString()

      await createTask({ title: newTitle, startAt, endAt })
      setNewTitle('')
      reload()
    } catch (err) {
      alert(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 日期栏 */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">时序</p>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {formatCNDate(currentDate)} {WEEKDAY_CN[currentDate.getDay()]}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" onClick={() => setCurrentDate((prev) => addDays(prev, -1))}>
            前一天
          </Button>
          <Button variant="secondary" onClick={() => setCurrentDate(new Date())}>
            今天
          </Button>
          <Button variant="secondary" onClick={() => setCurrentDate((prev) => addDays(prev, 1))}>
            后一天
          </Button>
        </div>
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {/* 进度 */}
      <Card>
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-semibold">今日进度</span>
          <span className="text-sm text-muted-foreground">
            {completedCount} / {items.length}
          </span>
        </div>
        <ProgressBar percent={percent} />
      </Card>

      {/* 时间线 */}
      <div>
        <SectionTitle>时间线</SectionTitle>

        {loading ? <EmptyState>加载中…</EmptyState> : null}
        {!loading && items.length === 0 ? <EmptyState>这一天还没有安排</EmptyState> : null}

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-sm transition',
                busyId === item.id && 'opacity-60'
              )}
            >
              <CheckCircle
                checked={item.completed}
                label={`${item.completed ? '取消完成' : '完成'}${item.title}`}
                onClick={() => void handleToggle(item)}
              />

              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm font-bold', item.completed && 'text-muted-foreground line-through')}>
                  {item.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{item.detail || '—'}</p>
              </div>

              <StatusPill tone={item.completed ? 'success' : 'neutral'}>{SOURCE_LABEL[item.source]}</StatusPill>
            </div>
          ))}
        </div>
      </div>

      {/* 新建任务 */}
      <div>
        <SectionTitle>新增任务</SectionTitle>
        <Card>
          <form onSubmit={handleCreateTask} className="flex flex-col gap-2 sm:flex-row">
            <input
              className="field flex-1"
              placeholder="任务标题，例如：写周报草稿"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
            <input
              className="field sm:w-28"
              type="time"
              value={newClock}
              onChange={(event) => setNewClock(event.target.value)}
            />
            <Button type="submit" disabled={creating || !newTitle.trim()}>
              {creating ? '创建中…' : '添加'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
