import React, { useState } from 'react'
import { X, CalendarRange, Clock, Timer, Tag, RotateCw } from 'lucide-react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'

export interface GoalSavePayload {
  id?: number
  title: string
  category: string
  startMonth: number
  endMonth: number
  time: string
  duration: number
  carryOverEnabled: boolean
  carryOverDays: number
  forceOverwriteTiming?: boolean
}

interface GoalModalProps {
  goal?: Goal | null
  onClose: () => void
  onSave: (data: GoalSavePayload) => void
  onDelete?: (id: number) => void
}

const CATEGORIES = ['学习', '健康', '工作', '生活', '未分类']
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1 < 10 ? '0' + (i + 1) : i + 1}月`
}))

export const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [category, setCategory] = useState(goal?.category ?? '学习')
  const [startMonth, setStartMonth] = useState(goal?.startMonth ?? 5)
  const [endMonth, setEndMonth] = useState(goal?.endMonth ?? 8)
  const [time, setTime] = useState(goal?.time ?? '09:00')
  const [duration, setDuration] = useState(goal?.duration ?? 45)
  const [carryOverEnabled, setCarryOverEnabled] = useState(goal?.carryOverEnabled ?? true)
  const [carryOverDays, setCarryOverDays] = useState(goal?.carryOverDays ?? 3)
  const [forceOverwriteTiming, setForceOverwriteTiming] = useState(false)

  const handleStartMonthChange = (val: number) => {
    setStartMonth(val)
    if (endMonth < val) {
      setEndMonth(val)
    }
  }

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      id: goal ? goal.id : undefined,
      title: title.trim(),
      category,
      startMonth,
      endMonth,
      time: time || '09:00',
      duration: Number(duration) || 45,
      carryOverEnabled,
      carryOverDays: Number(carryOverDays) || 3,
      forceOverwriteTiming
    })
    onClose()
  }

  const handleDelete = () => {
    if (goal && onDelete) {
      onDelete(goal.id)
    }
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[390px] max-h-[88vh] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col overflow-y-auto no-scrollbar">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0"></div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-[17px] font-bold tracking-tight text-zinc-900">
            {goal ? '编辑目标' : '添加新目标'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="space-y-4 text-xs">
          {/* 目标名称 */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs">目标名称</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              type="text"
              placeholder="例如：掌握 Rust 异步系统编程 / 备赛马拉松"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400"
            />
          </div>

          {/* 起止月份联动（对齐 Web 端） */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
              <CalendarRange size={12} className="text-zinc-400" />
              执行起止时轴
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                <span className="text-zinc-400 text-[11px] font-medium mr-2 shrink-0">开始:</span>
                <select
                  value={startMonth}
                  onChange={(e) => handleStartMonthChange(Number(e.target.value))}
                  className="w-full bg-transparent font-mono text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                <span className="text-zinc-400 text-[11px] font-medium mr-2 shrink-0">结束:</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                  className="w-full bg-transparent font-mono text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} disabled={m.value < startMonth}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 目标分类标签选择 */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
              <Tag size={12} className="text-zinc-400" />
              目标分类
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    category === cat
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 默认排期时间与时长 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
                <Clock size={12} className="text-zinc-400" />
                默认执行时间
              </label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                type="time"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
                <Timer size={12} className="text-zinc-400" />
                预计时长
              </label>
              <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                <input
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 0)}
                  type="number"
                  min="5"
                  step="5"
                  className="w-full bg-transparent text-xs font-mono font-medium focus:outline-none"
                />
                <span className="text-[11px] text-zinc-400 font-medium shrink-0">分钟</span>
              </div>
            </div>
          </div>

          {/* 未完成延后展示 (Carry-Over 机制，完全对齐 Web 端) */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1">
                  <RotateCw size={12} className="text-zinc-500" />
                  未完成延后展示 (Carry-Over)
                </span>
                <p className="text-[10px] text-zinc-400 mt-0.5">未完成的目标任务自动在时序中顺延</p>
              </div>

              {/* 分段按钮开关 */}
              <div className="flex bg-zinc-200/70 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCarryOverEnabled(false)}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer',
                    !carryOverEnabled ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-500'
                  )}
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={() => setCarryOverEnabled(true)}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[11px] transition-all cursor-pointer',
                    carryOverEnabled ? 'bg-white text-zinc-900 font-semibold shadow-xs' : 'text-zinc-500'
                  )}
                >
                  开启
                </button>
              </div>
            </div>

            {carryOverEnabled && (
              <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50">
                <span className="text-[11px] text-zinc-600 font-medium">顺延天数</span>
                <div className="flex items-center gap-1.5">
                  <input
                    value={carryOverDays}
                    onChange={(e) => setCarryOverDays(Number(e.target.value) || 1)}
                    type="number"
                    min="1"
                    max="14"
                    className="w-12 bg-white border border-zinc-200 rounded-lg px-2 py-1 text-center font-mono text-xs font-bold focus:outline-none"
                  />
                  <span className="text-[11px] text-zinc-400">天</span>
                </div>
              </div>
            )}
          </div>

          {/* 编辑模式：同步更新子级时间 */}
          {goal && (
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={forceOverwriteTiming}
                onChange={(e) => setForceOverwriteTiming(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-0"
              />
              <span className="text-[11px] text-zinc-500 leading-snug">
                同步更新子级月度战役的执行时间与时长
              </span>
            </label>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="flex items-center gap-2.5 pt-2 shrink-0">
          {goal && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              删除
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {goal ? '确认修改' : '确认创建'}
          </button>
        </div>
      </div>
    </div>
  )
}
