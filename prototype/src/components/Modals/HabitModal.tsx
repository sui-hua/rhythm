import React, { useState } from 'react'
import { X } from 'lucide-react'
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

  // 快捷频次预设模式：'daily' | 'workdays' | 'custom'
  const getInitialPreset = (): 'daily' | 'workdays' | 'custom' => {
    if (!habit) return 'daily'
    if (habit.frequency === '工作日') return 'workdays'
    if (habit.frequency === '每日') return 'daily'
    return 'custom'
  }

  const [preset, setPreset] = useState<'daily' | 'workdays' | 'custom'>(getInitialPreset)
  const [weekdays, setWeekdays] = useState<number[]>(habit?.weekdays ?? [1, 3, 5])

  const toggleWeekday = (val: number) => {
    setWeekdays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val].sort((a, b) => a - b)
    )
  }

  // 智能计算标准描述文本
  const getFrequencyLabel = (): string => {
    if (preset === 'daily') return '每日'
    if (preset === 'workdays') return '工作日'
    if (weekdays.length === 7) return '每日'
    if (weekdays.length === 5 && weekdays.every((d) => d >= 1 && d <= 5)) return '工作日'
    if (weekdays.length === 2 && weekdays.includes(6) && weekdays.includes(7)) return '周末'
    if (weekdays.length === 0) return '未选'
    const names = weekdays.map((d) => WEEKDAY_OPTIONS.find((w) => w.value === d)?.label).filter(Boolean)
    return `每周${names.join('/')}`
  }

  const canSubmit = title.trim().length > 0 && (preset !== 'custom' || weekdays.length > 0)

  const handleSave = () => {
    if (!canSubmit) return

    let finalWeekdays: number[] | undefined = undefined
    let finalType: FrequencyType = 'daily'

    if (preset === 'daily') {
      finalType = 'daily'
    } else if (preset === 'workdays') {
      finalType = 'weekly'
      finalWeekdays = [1, 2, 3, 4, 5]
    } else {
      finalType = 'weekly'
      finalWeekdays = weekdays
    }

    onSave({
      id: habit ? habit.id : undefined,
      title: title.trim(),
      frequency: getFrequencyLabel(),
      frequencyType: finalType,
      weekdays: finalWeekdays,
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
      {/* 贴底大卡片 · 延续 Rhythm 纯白与半深灰设计 */}
      <div className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0" />

        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-0.5 shrink-0">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 font-sans">
            {habit ? '编辑习惯' : '添加日常习惯'}
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
          {/* 纯净大字标题输入框 (无废话 Label) */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            placeholder="写下你想培养的习惯 (例如: 早起晨读 30分钟)"
            className="w-full bg-zinc-50 border border-zinc-200/70 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400"
          />

          {/* 微卡片 1：时间与时长 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 block">执行时间与时长</span>
            <div className="flex items-center justify-between gap-3">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900 focus:outline-none cursor-pointer shadow-2xs"
              />

              {/* 快捷时长胶囊 */}
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

          {/* 微卡片 2：重复频次 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400">重复频次</span>
              <span className="text-[11px] font-mono font-bold text-zinc-800">
                {getFrequencyLabel()}
              </span>
            </div>

            {/* 三大快捷胶囊 */}
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: 'daily', label: '每日' },
                  { key: 'workdays', label: '工作日' },
                  { key: 'custom', label: '每周...' }
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPreset(item.key)}
                  className={cn(
                    'py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border',
                    preset === item.key
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                      : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 仅在选自定义每周时，丝滑滑出 7 个黑白极简微钮 */}
            {preset === 'custom' && (
              <div className="pt-1.5 border-t border-zinc-200/50 animate-in fade-in-50 duration-150">
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
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
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
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="space-y-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {habit ? '保存修改' : '确认添加'}
          </button>

          {habit && (
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleArchive}
                className="py-2 text-xs font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                {habit.isArchived ? '取消归档' : '归档该习惯'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                删除此习惯
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
