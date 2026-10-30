'use client'

import { useMemo, useState } from 'react'
import { createGoal, listGoalCategories, listGoalOverview, toggleGoalDay } from '@/lib/api'
import type { GoalItem } from '@/lib/api'
import {
  formatMonthLabel,
  goalMonthProgress,
  goalProgress,
  goalSortRank,
  goalStage,
  goalStats,
  isGoalDayCompleted
} from '@/lib/goal-progress'
import { useAsyncData } from '@/lib/use-async-data'
import { Button, Card, CheckCircle, EmptyState, ErrorBanner, ProgressBar, SectionTitle, StatusPill, cn } from '@/components/ui'

const STAGE_LABEL = {
  completed: '已完成',
  inProgress: '进行中',
  notStarted: '待开始'
} as const

export default function DirectionPage() {
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [goals, categories] = await Promise.all([listGoalOverview(), listGoalCategories()])
      return { goals, categories }
    },
    []
  )

  const [categoryId, setCategoryId] = useState('all')
  const [openGoalId, setOpenGoalId] = useState<string | null>(null)
  const [openMonthId, setOpenMonthId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [creating, setCreating] = useState(false)

  const goals = data?.goals ?? []
  const categories = data?.categories ?? []
  const stats = useMemo(() => goalStats(goals), [goals])

  const filteredGoals = useMemo(() => {
    const matched = goals.filter((goal) => categoryId === 'all' || goal.categoryId === categoryId)

    return [...matched].sort((a, b) => {
      const rankDiff = goalSortRank(a) - goalSortRank(b)
      if (rankDiff !== 0) return rankDiff
      return goalProgress(b) - goalProgress(a)
    })
  }, [goals, categoryId])

  async function handleToggleDay(goalDayId: string, completed: boolean) {
    setBusyId(goalDayId)

    try {
      await toggleGoalDay(goalDayId, completed)
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
      await createGoal({
        title,
        description: description.trim() || undefined,
        categoryId: newCategoryId || null
      })
      setTitle('')
      setDescription('')
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
        <p className="text-xs text-muted-foreground">所向</p>
        <h1 className="text-2xl font-extrabold tracking-tight">我的目标</h1>
      </div>

      {error ? <ErrorBanner message={error} onRetry={reload} /> : null}

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {[{ id: 'all', name: '全部' }, ...categories].map((category) => {
          const active = categoryId === category.id
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-border'
              )}
            >
              {category.name}
            </button>
          )
        })}
      </div>

      {/* 统计 */}
      <Card className="grid grid-cols-3 divide-x divide-border py-4 text-center">
        <div>
          <p className="text-2xl font-extrabold">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">已完成</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{stats.inProgress}</p>
          <p className="text-xs text-muted-foreground">进行中</p>
        </div>
        <div>
          <p className="text-2xl font-extrabold">{stats.notStarted}</p>
          <p className="text-xs text-muted-foreground">待开始</p>
        </div>
      </Card>

      {loading ? <EmptyState>加载中…</EmptyState> : null}

      {/* 目标列表 */}
      <div className="space-y-2">
        {filteredGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            open={openGoalId === goal.id}
            openMonthId={openMonthId}
            busyId={busyId}
            onToggleOpen={() => {
              setOpenGoalId(openGoalId === goal.id ? null : goal.id)
              setOpenMonthId(goal.months[0]?.id ?? null)
            }}
            onToggleMonth={setOpenMonthId}
            onToggleDay={handleToggleDay}
          />
        ))}

        {!loading && filteredGoals.length === 0 ? <EmptyState>该分类下暂无目标</EmptyState> : null}
      </div>

      {/* 新建目标 */}
      <div>
        <SectionTitle>新建目标</SectionTitle>
        <Card>
          <form onSubmit={handleCreate} className="flex flex-col gap-2">
            <input
              className="field"
              placeholder="目标名称，例如：提升设计专业能力"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <input
              className="field"
              placeholder="描述（可选）"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="field flex-1"
                value={newCategoryId}
                onChange={(event) => setNewCategoryId(event.target.value)}
              >
                <option value="">不分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={creating || !title.trim()}>
                {creating ? '创建中…' : '添加'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

type GoalCardProps = {
  goal: GoalItem
  open: boolean
  openMonthId: string | null
  busyId: string | null
  onToggleOpen: () => void
  onToggleMonth: (monthId: string | null) => void
  onToggleDay: (goalDayId: string, completed: boolean) => void
}

function GoalCard({ goal, open, openMonthId, busyId, onToggleOpen, onToggleMonth, onToggleDay }: GoalCardProps) {
  const percent = Math.round(goalProgress(goal) * 100)
  const stage = goalStage(goal)

  return (
    <Card className="p-0">
      <button type="button" onClick={onToggleOpen} className="w-full px-4 py-3.5 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{goal.title}</p>
            <p className="truncate text-xs text-muted-foreground">{goal.description || '暂无描述'}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill tone={stage === 'completed' ? 'success' : 'neutral'}>{STAGE_LABEL[stage]}</StatusPill>
            <span className="text-lg font-extrabold">{percent}%</span>
          </div>
        </div>
        <div className="pt-3">
          <ProgressBar percent={percent} />
        </div>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-border px-4 py-3">
          {goal.months.length === 0 ? (
            <p className="text-xs text-muted-foreground">暂无月度计划记录</p>
          ) : null}

          {goal.months.map((month) => {
            const { done, total } = goalMonthProgress(month)
            const expanded = openMonthId === month.id

            return (
              <div key={month.id} className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => onToggleMonth(expanded ? null : month.id)}
                  className="flex w-full items-center justify-between bg-muted/60 px-3.5 py-2 text-left"
                >
                  <span className="text-sm font-semibold">{formatMonthLabel(month.month)}</span>
                  <span className="text-xs text-muted-foreground">
                    {done}/{total} 天
                  </span>
                </button>

                {expanded ? (
                  <div className="space-y-1 px-3 py-2">
                    {month.days.map((day) => {
                      const completed = isGoalDayCompleted(day.status)

                      return (
                        <div key={day.id} className="flex items-center gap-2.5 py-1">
                          <CheckCircle
                            checked={completed}
                            label={`${completed ? '取消完成' : '完成'}${day.title}`}
                            onClick={() => {
                              if (busyId === day.id) return
                              onToggleDay(day.id, !completed)
                            }}
                          />
                          <span className={cn('text-sm', completed && 'text-muted-foreground line-through')}>
                            {day.title}
                          </span>
                        </div>
                      )
                    })}
                    {month.days.length === 0 ? (
                      <p className="py-1 text-xs text-muted-foreground">该月还没有日计划</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </Card>
  )
}
