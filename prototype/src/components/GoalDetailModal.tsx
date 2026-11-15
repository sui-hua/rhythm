import React, { useState, useRef } from 'react'
import { X, ChevronDown, Check, Plus, Edit2, Clock } from 'lucide-react'
import type { Goal, GoalDay } from '../types'
import { cn } from '../lib/utils'

interface GoalDetailModalProps {
  goal: Goal
  onClose: () => void
  onEditGoal: (goal: Goal) => void
  onToggleGoalDay: (goalId: number, monthId: number | string, dayId: number | string) => void
  onAddGoalDay: (goalId: number, monthId: number | string, newDay: Omit<GoalDay, 'id'>) => void
  onUpdateMonthTitle: (goalId: number, monthId: number | string, newTitle: string) => void
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  goal,
  onClose,
  onEditGoal,
  onToggleGoalDay,
  onAddGoalDay,
  onUpdateMonthTitle
}) => {
  // 当前默认展开当月（若有 5 月展开 5 月，否则展开第一个月）
  const [openMonthId, setOpenMonthId] = useState<number | string>(() => {
    const mayMonth = goal.months?.find((m) => m.month === 5)
    return mayMonth ? mayMonth.id : (goal.months?.[0]?.id ?? '')
  })

  // 内联编辑月度战役标题状态
  const [editingMonthId, setEditingMonthId] = useState<number | string | null>(null)
  const [editingMonthTitle, setEditingMonthTitle] = useState('')

  // 新增天目标快捷输入框状态
  const [newDayNum, setNewDayNum] = useState<number>(12)
  const [newDayTitle, setNewDayTitle] = useState('')
  const [isAddingDay, setIsAddingDay] = useState(false)

  // 下拉滑动手势
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setDragY(delta)
    }
  }

  const handleTouchEnd = () => {
    if (dragY > 120) {
      onClose()
    } else {
      setDragY(0)
    }
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY
    setIsDragging(true)

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY
      if (delta > 0) setDragY(delta)
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      const delta = upEvent.clientY - startY
      if (delta > 120) onClose()
      else setDragY(0)
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // 动态计算总进度
  const allDays = (goal.months || []).flatMap((m) => m.days || [])
  const completedDaysCount = allDays.filter((d) => d.completed).length
  const totalDaysCount = allDays.length
  const dynamicTotalProgress =
    totalDaysCount > 0 ? Math.round((completedDaysCount / totalDaysCount) * 100) : goal.progress

  // 提交修改月度战役标题
  const handleSaveMonthTitle = (monthId: number | string) => {
    if (editingMonthTitle.trim()) {
      onUpdateMonthTitle(goal.id, monthId, editingMonthTitle.trim())
    }
    setEditingMonthId(null)
  }

  // 提交添加天目标
  const handleCreateDay = (monthId: number | string, monthNum: number) => {
    if (!newDayTitle.trim()) return
    const padMonth = String(monthNum).padStart(2, '0')
    const padDay = String(newDayNum).padStart(2, '0')
    onAddGoalDay(goal.id, monthId, {
      day: newDayNum,
      date: `2026-${padMonth}-${padDay}`,
      title: newDayTitle.trim(),
      completed: false,
      time: goal.time || '09:00',
      duration: goal.duration || 45
    })
    setNewDayTitle('')
    setIsAddingDay(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 pt-3 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col max-h-[92vh]"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部手柄条与操作栏 */}
        <div
          className="relative flex items-center justify-center py-2 shrink-0 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div
            className="w-10 h-1 bg-zinc-200 hover:bg-zinc-300 rounded-full cursor-pointer transition-colors"
            onClick={onClose}
            title="下拉或点击关闭"
          />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEditGoal(goal)}
              aria-label="编辑目标属性"
              className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-full transition-colors cursor-pointer"
              title="配置周期与属性"
            >
              <Edit2 size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="关闭"
              className="text-zinc-400 hover:text-zinc-900 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 顶部目标战略总览 */}
        <div className="space-y-2.5 pb-2 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-semibold">
              {goal.category}
            </span>
            <span className="text-[11px] font-mono text-zinc-400 font-medium">
              {goal.startMonth}月 ~ {goal.endMonth}月
            </span>
            {goal.time && (
              <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                <Clock size={11} className="text-zinc-400" />
                {goal.time} ({goal.duration || 45}分)
              </span>
            )}
          </div>

          <h1 className="text-lg font-bold tracking-tight text-zinc-900">{goal.title}</h1>

          {/* 总进度条与完成比例 */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 font-sans font-medium text-[11px]">整体推进进度</span>
              <span className="font-bold text-zinc-900">{dynamicTotalProgress}%</span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, dynamicTotalProgress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* 月度战役与天目标列表区 (可滚动) */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              月度战役拆解 ({goal.months?.length || 0} 个月)
            </span>
            <span className="text-[10.5px] text-zinc-400">点击月份展开天目标</span>
          </div>

          {/* 各月战役手风琴卡片 */}
          {(goal.months || []).map((month) => {
            const isOpen = openMonthId === month.id
            const mDays = month.days || []
            const mCompleted = mDays.filter((d) => d.completed).length
            const mTotal = mDays.length
            const mProgress = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0
            const isEditingTitle = editingMonthId === month.id

            return (
              <div
                key={month.id}
                className={cn(
                  'rounded-2xl border transition-all duration-200 overflow-hidden',
                  isOpen
                    ? 'border-zinc-900/30 bg-zinc-50/50 shadow-xs'
                    : 'border-zinc-200/70 bg-white hover:bg-zinc-50/40'
                )}
              >
                {/* 月份卡片标头 */}
                <div
                  onClick={() => setOpenMonthId(isOpen ? '' : month.id)}
                  className="p-3.5 flex items-start justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span
                      className={cn(
                        'text-xs font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors',
                        isOpen ? 'bg-zinc-900 text-white shadow-xs' : 'bg-zinc-100 text-zinc-700'
                      )}
                    >
                      {month.month < 10 ? '0' + month.month : month.month}月
                    </span>

                    <div className="min-w-0 flex-1">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingMonthTitle}
                            onChange={(e) => setEditingMonthTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveMonthTitle(month.id)
                            }}
                            autoFocus
                            placeholder="输入本月核心战役任务..."
                            className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1 text-xs font-medium text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveMonthTitle(month.id)}
                            className="p-1 bg-zinc-900 text-white rounded-lg text-xs"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 group/title">
                          <h3
                            className={cn(
                              'text-sm font-semibold tracking-tight truncate',
                              month.title ? 'text-zinc-900' : 'text-zinc-400 italic font-normal'
                            )}
                          >
                            {month.title || '点此分配本月核心战役...'}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMonthId(month.id)
                              setEditingMonthTitle(month.title || '')
                            }}
                            className="opacity-0 group-hover/title:opacity-100 text-zinc-400 hover:text-zinc-900 p-0.5 transition-opacity"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-zinc-400">
                        <span>
                          {mCompleted}/{mTotal} 天达成
                        </span>
                        <span>·</span>
                        <span>{mProgress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <ChevronDown
                      size={16}
                      className={cn(
                        'text-zinc-400 transition-transform duration-200',
                        isOpen && 'rotate-180 text-zinc-900'
                      )}
                    />
                  </div>
                </div>

                {/* 展开内容：天目标每日清单 */}
                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-zinc-200/50 animate-in fade-in-50 duration-150">
                    {/* 天目标清单 */}
                    <div className="space-y-1.5 pt-1">
                      {mDays.map((day) => (
                        <div
                          key={day.id}
                          onClick={() => onToggleGoalDay(goal.id, month.id, day.id)}
                          className={cn(
                            'p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer select-none active:scale-[0.99]',
                            day.completed
                              ? 'bg-zinc-100/60 border-zinc-200/40 opacity-70'
                              : 'bg-white border-zinc-200/80 shadow-2xs hover:border-zinc-300'
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* 打卡勾选圈 */}
                            <button
                              type="button"
                              className={cn(
                                'w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0',
                                day.completed
                                  ? 'bg-zinc-900 text-white shadow-2xs'
                                  : 'border border-zinc-300 hover:border-zinc-500 bg-white'
                              )}
                            >
                              {day.completed && <Check size={11} strokeWidth={3} />}
                            </button>

                            {/* 日期微标 */}
                            <span className="text-[11px] font-mono font-bold text-zinc-400 shrink-0">
                              {month.month}月{day.day}日
                            </span>

                            {/* 天目标标题 */}
                            <span
                              className={cn(
                                'text-xs font-medium truncate flex-1',
                                day.completed ? 'text-zinc-400 line-through' : 'text-zinc-800'
                              )}
                            >
                              {day.title}
                            </span>
                          </div>

                          {/* 任务时长 */}
                          {day.duration && (
                            <span className="text-[10.5px] font-mono text-zinc-400 shrink-0">
                              {day.duration}分
                            </span>
                          )}
                        </div>
                      ))}

                      {mDays.length === 0 && (
                        <p className="text-xs text-zinc-400 text-center py-3 font-medium">
                          本月暂未规划具体天目标
                        </p>
                      )}
                    </div>

                    {/* 添加天目标快速入口 */}
                    {isAddingDay ? (
                      <div className="p-2.5 bg-white border border-zinc-300 rounded-xl space-y-2 animate-in fade-in-50 duration-150">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-zinc-500 shrink-0">
                            {month.month}月
                          </span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={newDayNum}
                            onChange={(e) => setNewDayNum(Number(e.target.value))}
                            className="w-14 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center"
                          />
                          <span className="text-xs text-zinc-500 shrink-0">日</span>
                          <input
                            type="text"
                            value={newDayTitle}
                            onChange={(e) => setNewDayTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreateDay(month.id, month.month)
                            }}
                            autoFocus
                            placeholder="输入具体天目标内容..."
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
                            onClick={() => handleCreateDay(month.id, month.month)}
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
                        className="w-full py-2 border border-dashed border-zinc-300/80 hover:border-zinc-900 hover:bg-white rounded-xl text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>规划天目标 (Day Plan)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
