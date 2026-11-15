import React, { useState } from 'react'
import { ChevronRight, ArrowLeft, Check, Plus, Edit2, SlidersHorizontal } from 'lucide-react'
import type { Goal } from '../types'
import { cn } from '../lib/utils'

interface DirectionViewProps {
  goals: Goal[]
  onEditGoal: (goal: Goal) => void
  onToggleGoalDay: (goalId: number, monthId: number | string, dayId: number | string) => void
  onAddGoalDay: (
    goalId: number,
    monthId: number | string,
    newDay: { day: number; date: string; title: string; completed: boolean; time?: string; duration?: number }
  ) => void
  onUpdateMonthTitle: (goalId: number, monthId: number | string, newTitle: string) => void
}

export const DirectionView: React.FC<DirectionViewProps> = ({
  goals,
  onEditGoal,
  onToggleGoalDay,
  onAddGoalDay,
  onUpdateMonthTitle
}) => {
  // Things 3 三层层级下钻状态
  // activeGoalId: null -> 第一层 (战略总览)
  // activeGoalId: number, activeMonthId: null -> 第二层 (月度战役列表)
  // activeGoalId: number, activeMonthId: string|number -> 第三层 (每日天目标清单)
  const [activeGoalId, setActiveGoalId] = useState<number | null>(null)
  const [activeMonthId, setActiveMonthId] = useState<number | string | null>(null)

  // 内联编辑月度战役标题
  const [isEditingMonthTitle, setIsEditingMonthTitle] = useState(false)
  const [monthTitleDraft, setMonthTitleDraft] = useState('')

  // 第三层快捷添加天目标
  const [isAddingDay, setIsAddingDay] = useState(false)
  const [newDayNum, setNewDayNum] = useState<number>(12)
  const [newDayTitle, setNewDayTitle] = useState('')

  const activeGoal = goals.find((g) => g.id === activeGoalId) || null
  const activeMonth = activeGoal?.months?.find((m) => m.id === activeMonthId) || null

  // 提交修改月度战役标题
  const handleSaveMonthTitle = () => {
    if (activeGoal && activeMonth && monthTitleDraft.trim()) {
      onUpdateMonthTitle(activeGoal.id, activeMonth.id, monthTitleDraft.trim())
    }
    setIsEditingMonthTitle(false)
  }

  // 提交新建天目标
  const handleCreateDay = () => {
    if (!activeGoal || !activeMonth || !newDayTitle.trim()) return
    const padMonth = String(activeMonth.month).padStart(2, '0')
    const padDay = String(newDayNum).padStart(2, '0')
    onAddGoalDay(activeGoal.id, activeMonth.id, {
      day: newDayNum,
      date: `2026-${padMonth}-${padDay}`,
      title: newDayTitle.trim(),
      completed: false,
      time: activeMonth.time || activeGoal.time || '09:00',
      duration: activeMonth.duration || activeGoal.duration || 45
    })
    setNewDayTitle('')
    setIsAddingDay(false)
  }

  // ─────────────────────────────────────────────────────────────
  // 【第三层：每日天目标行动清单 (Things 3 Daily Actions)】
  // ─────────────────────────────────────────────────────────────
  if (activeGoal && activeMonth) {
    const monthDays = activeMonth.days || []
    const completedCount = monthDays.filter((d) => d.completed).length
    const totalCount = monthDays.length
    const monthProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
      <div className="px-5 pt-2 pb-16 space-y-3.5 animate-in slide-in-from-right duration-200">
        {/* 顶部面包屑返回条 */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => setActiveMonthId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer py-1"
          >
            <ArrowLeft size={14} />
            <span className="truncate max-w-[200px]">{activeGoal.title}</span>
          </button>
          <span className="text-[11px] font-mono text-zinc-400 font-medium">
            {completedCount}/{totalCount} 天
          </span>
        </div>

        {/* 标题区 (非卡片，支持直接编辑本月战役名称，不重复展示月目标卡片) */}
        <div className="pt-0.5 pb-0.5">
          {isEditingMonthTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={monthTitleDraft}
                onChange={(e) => setMonthTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveMonthTitle()
                }}
                autoFocus
                placeholder="分配本月核心战役目标..."
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <button
                type="button"
                onClick={handleSaveMonthTitle}
                className="p-1.5 bg-zinc-900 text-white rounded-lg text-xs cursor-pointer shrink-0"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setMonthTitleDraft(activeMonth.title || '')
                setIsEditingMonthTitle(true)
              }}
              className="flex items-baseline justify-between gap-2 cursor-pointer group/title"
              title="点击修改月度战役"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-white shrink-0">
                  {activeMonth.month < 10 ? '0' + activeMonth.month : activeMonth.month}月
                </span>
                <h1
                  className={cn(
                    'text-base font-bold tracking-tight truncate',
                    activeMonth.title ? 'text-zinc-900' : 'text-zinc-400 italic font-normal'
                  )}
                >
                  {activeMonth.title || '点击设置月度战役...'}
                </h1>
                <Edit2 size={12} className="text-zinc-400 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
              </div>
              <span className="text-xs font-mono font-semibold text-zinc-400 shrink-0">
                {monthProgress}%
              </span>
            </div>
          )}
        </div>

        {/* 每日天目标待办清单 (Things 3 经典纯粹清单) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              天目标行动清单 ({monthDays.length})
            </span>
            <span className="text-[10px] text-zinc-400">轻点圆圈快速打卡</span>
          </div>

          <div className="space-y-1.5">
            {monthDays.map((day) => (
              <div
                key={day.id}
                onClick={() => onToggleGoalDay(activeGoal.id, activeMonth.id, day.id)}
                className={cn(
                  'p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none active:scale-[0.99]',
                  day.completed
                    ? 'bg-zinc-50 border-zinc-200/50 opacity-70'
                    : 'bg-white border-zinc-200/80 shadow-2xs hover:border-zinc-300'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* 打卡圆圈 */}
                  <button
                    type="button"
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0',
                      day.completed
                        ? 'bg-zinc-900 text-white shadow-2xs'
                        : 'border border-zinc-300 hover:border-zinc-900 bg-white'
                    )}
                  >
                    {day.completed && <Check size={11} strokeWidth={3} />}
                  </button>

                  {/* 日期小标签 */}
                  <span className="text-[11px] font-mono font-bold text-zinc-400 shrink-0">
                    {activeMonth.month}月{day.day}日
                  </span>

                  {/* 标题 */}
                  <span
                    className={cn(
                      'text-xs font-medium truncate flex-1',
                      day.completed ? 'text-zinc-400 line-through' : 'text-zinc-900'
                    )}
                  >
                    {day.title}
                  </span>
                </div>

                {day.duration && (
                  <span className="text-[10.5px] font-mono text-zinc-400 shrink-0">
                    {day.duration}分
                  </span>
                )}
              </div>
            ))}

            {monthDays.length === 0 && (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs text-zinc-400 font-medium">本月暂未规划具体天目标</p>
                <p className="text-[11px] text-zinc-300 font-sans">点击下方输入框即可快速创建</p>
              </div>
            )}
          </div>

          {/* Things 3 风格快速创建行动栏 */}
          {isAddingDay ? (
            <div className="p-3 bg-white border border-zinc-900/30 rounded-2xl space-y-2 shadow-sm animate-in fade-in-50 duration-150">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-500 shrink-0">
                  {activeMonth.month}月
                </span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newDayNum}
                  onChange={(e) => setNewDayNum(Number(e.target.value))}
                  className="w-12 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center"
                />
                <span className="text-xs text-zinc-500 shrink-0">日</span>
                <input
                  type="text"
                  value={newDayTitle}
                  onChange={(e) => setNewDayTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateDay()
                  }}
                  autoFocus
                  placeholder="输入天目标内容..."
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="flex items-center justify-end gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsAddingDay(false)}
                  className="px-2.5 py-1 rounded-lg text-xs text-zinc-500 hover:bg-zinc-100 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleCreateDay}
                  disabled={!newDayTitle.trim()}
                  className="px-3 py-1 rounded-lg text-xs bg-zinc-900 text-white font-semibold disabled:opacity-40 cursor-pointer"
                >
                  添加
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsAddingDay(true)
                setNewDayNum(15)
              }}
              className="w-full py-2.5 border border-dashed border-zinc-300 hover:border-zinc-900 hover:bg-white rounded-2xl text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>规划新天目标 (Day Action)</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 【第二层：月度战役列表 (Things 3 Monthly Campaigns)】
  // ─────────────────────────────────────────────────────────────
  if (activeGoal) {
    const months = activeGoal.months || []

    return (
      <div className="px-5 pt-2 pb-16 space-y-3.5 animate-in slide-in-from-right duration-200">
        {/* 顶部面包屑返回条 */}
        <div className="flex items-center justify-between pb-1">
          <button
            type="button"
            onClick={() => setActiveGoalId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer py-1"
          >
            <ArrowLeft size={14} />
            <span>全部目标</span>
          </button>
          <button
            type="button"
            onClick={() => onEditGoal(activeGoal)}
            className="text-zinc-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer"
            title="编辑目标周期与属性"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* 标题区 (非卡片，仅呈现当前目标名称与总进度，不重复展示总目标概览大卡) */}
        <div className="pt-0.5 pb-0.5">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 truncate">
              {activeGoal.title}
            </h1>
            <span className="text-xs font-mono font-bold text-zinc-400 shrink-0">
              {activeGoal.progress}%
            </span>
          </div>
        </div>

        {/* 月度战役阶段列表 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              月度战役分解 ({months.length} 个阶段)
            </span>
            <span className="text-[10px] text-zinc-400">点击进入执行清单</span>
          </div>

          <div className="space-y-2">
            {months.map((month) => {
              const mDays = month.days || []
              const completedCount = mDays.filter((d) => d.completed).length
              const totalCount = mDays.length
              const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
              const isMay = month.month === 5 // 当前模拟基准月份为 5 月

              return (
                <div
                  key={month.id}
                  onClick={() => setActiveMonthId(month.id)}
                  className="group p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* 月份徽标 */}
                    <span
                      className={cn(
                        'text-xs font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors',
                        isMay ? 'bg-zinc-900 text-white shadow-xs' : 'bg-zinc-100 text-zinc-700'
                      )}
                    >
                      {month.month < 10 ? '0' + month.month : month.month}月
                    </span>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h3
                          className={cn(
                            'text-sm font-semibold tracking-tight truncate',
                            month.title ? 'text-zinc-900' : 'text-zinc-400 italic font-normal'
                          )}
                        >
                          {month.title || '点此分配本月核心战役...'}
                        </h3>
                        {isMay && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 shrink-0">
                            进行中
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                        <span>
                          {totalCount > 0 ? `已达成 ${completedCount}/${totalCount} 天` : '暂未规划任务'}
                        </span>
                        {totalCount > 0 && <span>·</span>}
                        {totalCount > 0 && <span className="font-semibold text-zinc-700">{progress}%</span>}
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors shrink-0" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // 【第一层：战略总览 (Things 3 Goals List)】
  // ─────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pt-3.5 space-y-2.5">
      {goals.map((goal) => {
        const mayMonth = goal.months?.find((m) => m.month === 5)
        const displayMilestone = mayMonth?.title ? `5月：${mayMonth.title}` : goal.milestone
        const mayDays = mayMonth?.days || []
        const mayCompleted = mayDays.filter((d) => d.completed).length

        return (
          <div
            key={goal.id}
            onClick={() => setActiveGoalId(goal.id)}
            className="group p-4 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.99] space-y-3 border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-semibold">
                    {goal.category}
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-400">
                    {goal.startMonth}月 ~ {goal.endMonth}月
                  </span>
                </div>
                <h2 className="text-[15.5px] font-semibold tracking-tight text-zinc-900 mt-1.5 truncate">
                  {goal.title}
                </h2>
              </div>
              <span
                className={cn(
                  'text-[12px] font-mono font-bold px-2.5 py-0.5 rounded-md shrink-0 transition-colors',
                  goal.progress >= 100 ? 'bg-zinc-900 text-white shadow-xs' : 'bg-zinc-100 text-zinc-800'
                )}
              >
                {goal.progress}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
              <p className="truncate flex-1 pr-2">{displayMilestone}</p>
              {mayDays.length > 0 && (
                <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                  本月 {mayCompleted}/{mayDays.length} 天
                </span>
              )}
            </div>

            {/* 极细质感进度条 (Apple 规范 1.5 轨高) */}
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
              />
            </div>
          </div>
        )
      })}
    </section>
  )
}
