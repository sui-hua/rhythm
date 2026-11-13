import React, { useState } from 'react'
import { X } from 'lucide-react'
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
const CARRY_OVER_OPTIONS = [1, 3, 5, 7]
const QUICK_DURATIONS = [30, 45, 60, 90]

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

  const canSubmit = title.trim().length > 0

  const handleSave = () => {
    if (!canSubmit) return
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
      <div className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0" />

        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-0.5 shrink-0">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 font-sans">
            {goal ? '编辑目标' : '添加长期目标'}
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
        <div className="space-y-3 shrink-0">
          {/* 目标标题输入 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            placeholder="写下你的战略目标 (例如: 掌握 Rust 异步编程)"
            className="w-full bg-zinc-50 border border-zinc-200/70 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400"
          />

          {/* 微卡片 1：执行时轴与分类 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400">执行起止时轴</span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <select
                  value={startMonth}
                  onChange={(e) => handleStartMonthChange(Number(e.target.value))}
                  className="bg-white border border-zinc-200/80 px-2 py-1 rounded-lg font-bold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-400 font-sans">至</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                  className="bg-white border border-zinc-200/80 px-2 py-1 rounded-lg font-bold text-zinc-900 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} disabled={m.value < startMonth}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 目标分类 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-200/50">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                    category === cat
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                      : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 微卡片 2：默认执行时间与时长 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 block">默认执行时间与单次时长</span>
            <div className="flex items-center justify-between gap-3">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900 focus:outline-none cursor-pointer shadow-2xs"
              />

              <div className="flex items-center gap-1.5">
                {QUICK_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer',
                      duration === dur
                        ? 'bg-zinc-900 text-white font-bold shadow-xs'
                        : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                    )}
                  >
                    {dur}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 微卡片 3：未完成延后展示 Carry-Over */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">未完成延后展示 (Carry-Over)</span>
                <span className="text-[10.5px] text-zinc-400">过期自动在时序日程轴中向后顺延</span>
              </div>
              <div className="flex bg-zinc-200/70 p-0.5 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCarryOverEnabled(false)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer',
                    !carryOverEnabled ? 'bg-white text-zinc-900 font-bold shadow-xs' : 'text-zinc-500'
                  )}
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={() => setCarryOverEnabled(true)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer',
                    carryOverEnabled ? 'bg-zinc-900 text-white font-bold shadow-xs' : 'text-zinc-500'
                  )}
                >
                  开启
                </button>
              </div>
            </div>

            {carryOverEnabled && (
              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/50">
                <span className="text-[11px] text-zinc-500 font-medium">顺延天数</span>
                <div className="flex items-center gap-1.5">
                  {CARRY_OVER_OPTIONS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setCarryOverDays(days)}
                      className={cn(
                        'px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer',
                        carryOverDays === days
                          ? 'bg-zinc-900 text-white font-bold shadow-xs'
                          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      )}
                    >
                      {days}天
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {goal && (
            <label className="flex items-center gap-2 px-1 cursor-pointer select-none text-xs text-zinc-500">
              <input
                type="checkbox"
                checked={forceOverwriteTiming}
                onChange={(e) => setForceOverwriteTiming(e.target.checked)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
              />
              <span>同步更新子级月度战役的执行时间</span>
            </label>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="space-y-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {goal ? '保存修改' : '确认创建'}
          </button>

          {goal && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                删除此目标
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
