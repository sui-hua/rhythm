import React, { useState } from 'react'
import { ArrowLeft, Check, Plus, Edit2 } from 'lucide-react'
import type { Goal, GoalMonth } from '../../types'
import { cn } from '../../lib/utils'

interface GoalDaysLayerProps {
  goal: Goal
  month: GoalMonth
  onBack: () => void
  onToggleDay: (dayId: number | string) => void
  onAddDay: (newDay: {
    day: number
    date: string
    title: string
    completed: boolean
    time?: string
    duration?: number
  }) => void
  onUpdateMonthTitle: (newTitle: string) => void
}

/**
 * 第三层：每日天目标行动清单 (Things 3 Daily Actions)
 * 不重复展示第二层的月度战役概览卡片，直接聚焦于天目标行动项
 */
export const GoalDaysLayer: React.FC<GoalDaysLayerProps> = ({
  goal,
  month,
  onBack,
  onToggleDay,
  onAddDay,
  onUpdateMonthTitle
}) => {
  // 内联编辑月度战役标题
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')

  // 快捷添加天目标
  const [isAddingDay, setIsAddingDay] = useState(false)
  const [newDayNum, setNewDayNum] = useState<number>(12)
  const [newDayTitle, setNewDayTitle] = useState('')

  const monthDays = month.days || []
  const completedCount = monthDays.filter((d) => d.completed).length
  const totalCount = monthDays.length
  const monthProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      onUpdateMonthTitle(titleDraft.trim())
    }
    setIsEditingTitle(false)
  }

  const handleCreateDay = () => {
    if (!newDayTitle.trim()) return
    const padMonth = String(month.month).padStart(2, '0')
    const padDay = String(newDayNum).padStart(2, '0')
    onAddDay({
      day: newDayNum,
      date: `2026-${padMonth}-${padDay}`,
      title: newDayTitle.trim(),
      completed: false,
      time: month.time || goal.time || '09:00',
      duration: month.duration || goal.duration || 45
    })
    setNewDayTitle('')
    setIsAddingDay(false)
  }

  return (
    <div className="px-5 pt-2 pb-16 space-y-3.5 animate-in slide-in-from-right duration-200">
      {/* 顶部面包屑返回条 */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft size={14} />
          <span className="truncate max-w-[200px]">{goal.title}</span>
        </button>
        <span className="text-[11px] font-mono text-zinc-400 font-medium">
          {completedCount}/{totalCount} 天
        </span>
      </div>

      {/* 标题区 (非卡片，支持直接编辑本月战役名称，不重复展示月目标卡片) */}
      <div className="pt-0.5 pb-0.5">
        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle()
              }}
              autoFocus
              placeholder="分配本月核心战役目标..."
              className="w-full bg-zinc-50 border border-zinc-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
            <button
              type="button"
              onClick={handleSaveTitle}
              className="p-1.5 bg-zinc-900 text-white rounded-lg text-xs cursor-pointer shrink-0"
            >
              <Check size={12} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setTitleDraft(month.title || '')
              setIsEditingTitle(true)
            }}
            className="flex items-baseline justify-between gap-2 cursor-pointer group/title"
            title="点击修改月度战役"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-zinc-900 text-white shrink-0">
                {month.month < 10 ? '0' + month.month : month.month}月
              </span>
              <h1
                className={cn(
                  'text-base font-bold tracking-tight truncate',
                  month.title ? 'text-zinc-900' : 'text-zinc-400 italic font-normal'
                )}
              >
                {month.title || '点击设置月度战役...'}
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
              onClick={() => onToggleDay(day.id)}
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
                  {month.month}月{day.day}日
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
                {month.month}月
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
