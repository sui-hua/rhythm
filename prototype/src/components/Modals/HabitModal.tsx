import React, { useState } from 'react'
import { Clock, Timer, Repeat, Archive, Trash2 } from 'lucide-react'
import type { FrequencyType, Habit } from '../../types'
import { cn } from '../../lib/utils'

export interface HabitSavePayload {
  id?: number
  title: string
  frequency: string
  frequencyType: FrequencyType
  weekdays?: number[]
  monthDays?: number[]
  time: string
  duration: number
  isArchived?: boolean
}

interface HabitModalProps {
  habit?: Habit | null
  onClose: () => void
  onSave: (data: HabitSavePayload) => void
  onDelete?: (id: number) => void
  onToggleArchive?: (id: number, willArchive: boolean) => void
}

const WEEKDAY_OPTIONS = [
  { label: '一', value: 1, full: '周一' },
  { label: '二', value: 2, full: '周二' },
  { label: '三', value: 3, full: '周三' },
  { label: '四', value: 4, full: '周四' },
  { label: '五', value: 5, full: '周五' },
  { label: '六', value: 6, full: '周六' },
  { label: '日', value: 7, full: '周日' }
]

const QUICK_DURATIONS = [15, 30, 45, 60]
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export const HabitModal: React.FC<HabitModalProps> = ({
  habit,
  onClose,
  onSave,
  onDelete,
  onToggleArchive
}) => {
  const [title, setTitle] = useState(habit?.title ?? '')
  const [time, setTime] = useState(habit?.time ?? '07:00')
  const [duration, setDuration] = useState(habit?.duration ?? 30)
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    habit?.frequencyType ?? (habit?.frequency?.includes('周') ? 'weekly' : 'daily')
  )
  const [weekdays, setWeekdays] = useState<number[]>(habit?.weekdays ?? [1, 2, 3, 4, 5])
  const [monthDays, setMonthDays] = useState<number[]>(habit?.monthDays ?? [1, 15])

  const toggleWeekday = (val: number) => {
    setWeekdays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val].sort((a, b) => a - b)
    )
  }

  const toggleMonthDay = (val: number) => {
    setMonthDays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val].sort((a, b) => a - b)
    )
  }

  const getFrequencyLabel = (): string => {
    if (frequencyType === 'daily') return '每日'
    if (frequencyType === 'weekly') {
      if (weekdays.length === 7) return '每日'
      if (weekdays.length === 5 && weekdays.every((d) => d >= 1 && d <= 5)) return '工作日'
      if (weekdays.length === 2 && weekdays.includes(6) && weekdays.includes(7)) return '周末'
      const names = weekdays.map((d) => WEEKDAY_OPTIONS.find((w) => w.value === d)?.label).filter(Boolean)
      return `每周${names.join('/')}`
    }
    if (frequencyType === 'monthly') {
      if (monthDays.length <= 4) {
        return `每月${monthDays.join(',')}日`
      }
      return `每月 ${monthDays.length} 天`
    }
    return '每日'
  }

  const canSubmit =
    title.trim().length > 0 &&
    (frequencyType === 'daily' ||
      (frequencyType === 'weekly' && weekdays.length > 0) ||
      (frequencyType === 'monthly' && monthDays.length > 0))

  const handleSave = () => {
    if (!canSubmit) return
    onSave({
      id: habit ? habit.id : undefined,
      title: title.trim(),
      frequency: getFrequencyLabel(),
      frequencyType,
      weekdays: frequencyType === 'weekly' ? weekdays : undefined,
      monthDays: frequencyType === 'monthly' ? monthDays : undefined,
      time: time || '07:00',
      duration: Number(duration) || 30,
      isArchived: habit?.isArchived ?? false
    })
    onClose()
  }

  const handleDelete = () => {
    if (habit && onDelete) {
      onDelete(habit.id)
    }
    onClose()
  }

  const handleArchive = () => {
    if (habit && onToggleArchive) {
      onToggleArchive(habit.id, !habit.isArchived)
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
      <div className="w-full max-w-[390px] max-h-[90vh] bg-[#f2f2f7] rounded-t-[32px] shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-200 flex flex-col overflow-hidden">
        {/* iOS 经典手柄 */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 bg-zinc-300 rounded-full" />
        </div>

        {/* iOS 原生导航栏：取消 · 标题 · 完成/添加 */}
        <div className="px-4 py-2 flex items-center justify-between shrink-0 border-b border-zinc-200/60 bg-[#f2f2f7]">
          <button
            type="button"
            onClick={onClose}
            className="text-[16px] text-zinc-500 hover:text-zinc-800 active:opacity-60 transition-opacity cursor-pointer font-normal"
          >
            取消
          </button>
          <h2 className="text-[16.5px] font-semibold tracking-tight text-zinc-900 font-sans">
            {habit ? '编辑习惯' : '新建习惯'}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="text-[16px] font-semibold text-zinc-900 disabled:text-zinc-300 active:opacity-60 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {habit ? '完成' : '添加'}
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* Group 1：顶格无边框大字标题岛屿 */}
          <div className="bg-white rounded-2xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              placeholder="习惯名称 (如：早起晨读 30分钟)"
              className="w-full bg-transparent text-[17px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {/* Group 2：时间与时长 Inset Grouped 岛屿 */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] divide-y divide-zinc-100 overflow-hidden text-[15px]">
            {/* 时间行 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <span className="font-normal text-zinc-900">执行时间</span>
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-zinc-100/80 px-2.5 py-1 rounded-lg text-sm font-mono font-medium text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* 时长行 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Timer size={16} />
                </div>
                <span className="font-normal text-zinc-900">预计时长</span>
              </div>
              <div className="flex items-center gap-1.5">
                {QUICK_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer',
                      duration === dur
                        ? 'bg-zinc-900 text-white font-bold'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                    )}
                  >
                    {dur}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Group 3：重复频次 Inset Grouped 岛屿 */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] divide-y divide-zinc-100 overflow-hidden text-[15px]">
            {/* 重复频次类型切换 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Repeat size={16} />
                </div>
                <span className="font-normal text-zinc-900">重复频次</span>
              </div>
              <div className="flex bg-zinc-100 p-0.5 rounded-lg text-xs font-medium">
                {(
                  [
                    { key: 'daily', label: '每日' },
                    { key: 'weekly', label: '每周' },
                    { key: 'monthly', label: '每月' }
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFrequencyType(item.key)}
                    className={cn(
                      'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                      frequencyType === item.key
                        ? 'bg-white text-zinc-900 font-bold shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 每周内联展开：7 天星期药丸 */}
            {frequencyType === 'weekly' && (
              <div className="px-4 py-3 space-y-2 bg-zinc-50/50 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>选择执行日</span>
                  <span className="font-mono text-zinc-600 font-semibold">{getFrequencyLabel()}</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAY_OPTIONS.map((w) => {
                    const isSelected = weekdays.includes(w.value)
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => toggleWeekday(w.value)}
                        className={cn(
                          'h-9 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs scale-102'
                            : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                        )}
                        title={w.full}
                      >
                        {w.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 每月内联展开：1~31 号微型网格 */}
            {frequencyType === 'monthly' && (
              <div className="px-4 py-3 space-y-2 bg-zinc-50/50 animate-in fade-in-50 duration-150">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>选择每月日期</span>
                  <span className="font-mono text-zinc-600 font-semibold">{getFrequencyLabel()}</span>
                </div>
                <div className="grid grid-cols-7 gap-1 max-h-36 overflow-y-auto no-scrollbar p-0.5">
                  {MONTH_DAYS.map((d) => {
                    const isSelected = monthDays.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleMonthDay(d)}
                        className={cn(
                          'h-7 rounded-lg font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center',
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                        )}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Group 4（编辑模式专属）：独立危险操作卡片 */}
          {habit && (
            <div className="space-y-2.5 pt-2">
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] overflow-hidden">
                <button
                  type="button"
                  onClick={handleArchive}
                  className="w-full flex items-center justify-center gap-2 p-3.5 text-[15px] font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <Archive size={16} className="text-zinc-400" />
                  {habit.isArchived ? '恢复此习惯' : '归档此习惯'}
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] overflow-hidden">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 p-3.5 text-[15px] font-medium text-rose-600 hover:bg-rose-50/50 active:bg-rose-100/50 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  删除此习惯
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
