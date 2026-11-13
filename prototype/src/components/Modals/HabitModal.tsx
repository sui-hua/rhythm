import React, { useState } from 'react'
import { X, Clock, Timer, Archive, Trash2 } from 'lucide-react'
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

  // 计算标准可读频次描述
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
      <div className="w-full max-w-[390px] max-h-[88vh] bg-white rounded-t-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col space-y-4 overflow-y-auto no-scrollbar">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0"></div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-[17px] font-bold tracking-tight text-zinc-900">
            {habit ? '编辑习惯' : '添加新习惯'}
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
          {/* 习惯名称 */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs">习惯名称</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              type="text"
              placeholder="例如：每日阅读 / 早起健身"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400"
            />
          </div>

          {/* 习惯时间与时长（对齐 Web 端，自动排入当天时序流） */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
                <Clock size={12} className="text-zinc-400" />
                习惯时间
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

          {/* 重复方式（每日 / 每周 / 每月，完全对齐 Web 端） */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-zinc-700 font-semibold text-xs">重复方式</label>
              <span className="text-[11px] font-mono text-zinc-500 font-medium">
                {getFrequencyLabel()}
              </span>
            </div>

            {/* 三大分段按钮 */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100 rounded-xl">
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
                    'py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                    frequencyType === item.key
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 每周：展开周一至周日 7 天复选 Pills */}
            {frequencyType === 'weekly' && (
              <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl space-y-2 animate-in fade-in-50 duration-200">
                <p className="text-[11px] text-zinc-400 font-medium">选择每周执行的星期：</p>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_OPTIONS.map((w) => {
                    const isSelected = weekdays.includes(w.value)
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => toggleWeekday(w.value)}
                        className={cn(
                          'h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
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

            {/* 每月：展开 1~31 号日期网格多选 */}
            {frequencyType === 'monthly' && (
              <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl space-y-2 animate-in fade-in-50 duration-200">
                <p className="text-[11px] text-zinc-400 font-medium">选择每月执行的日期（1~31）：</p>
                <div className="grid grid-cols-7 gap-1 max-h-36 overflow-y-auto no-scrollbar p-0.5">
                  {MONTH_DAYS.map((d) => {
                    const isSelected = monthDays.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleMonthDay(d)}
                        className={cn(
                          'h-7 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center',
                          isSelected
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
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
        </div>

        {/* 底部操作区 */}
        <div className="space-y-2 pt-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {habit ? '保存修改' : '确认创建'}
          </button>

          {habit && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleArchive}
                className="py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                <Archive size={13} />
                {habit.isArchived ? '取消归档' : '归档该习惯'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2 px-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                删除习惯
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
