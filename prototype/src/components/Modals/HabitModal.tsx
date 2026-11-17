import React, { useState, useRef } from 'react'
import type { FrequencyType, Habit } from '../../types'
import { cn, formatMonthlyDays } from '../../lib/utils'
import { TimelineRibbon } from '../TimelineRibbon'
import { MonthlyDayBrushPicker } from '../MonthlyDayBrushPicker'

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

  // 频率类型初始化
  const getInitialFrequencyType = (): FrequencyType => {
    if (habit?.frequencyType) return habit.frequencyType
    if (habit?.monthDays && habit.monthDays.length > 0) return 'monthly'
    if (habit?.weekdays && habit.weekdays.length > 0 && habit.weekdays.length < 7) return 'weekly'
    if (habit?.frequency?.includes('月')) return 'monthly'
    if (habit?.frequency?.includes('周')) return 'weekly'
    return 'daily'
  }

  const [frequencyType, setFrequencyType] = useState<FrequencyType>(getInitialFrequencyType)
  const [weekdays, setWeekdays] = useState<number[]>(habit?.weekdays ?? [1, 2, 3, 4, 5])
  const [monthDays, setMonthDays] = useState<number[]>(habit?.monthDays ?? [1])

  // 下拉滑动手势交互
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
      if (delta > 0) {
        setDragY(delta)
      }
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      const delta = upEvent.clientY - startY
      if (delta > 120) {
        onClose()
      } else {
        setDragY(0)
      }
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const toggleWeekday = (val: number) => {
    setWeekdays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val].sort((a, b) => a - b)
    )
  }



  // 计算标准频次描述文本
  const getFrequencyLabel = (): string => {
    if (frequencyType === 'daily') {
      return '每日'
    }
    if (frequencyType === 'weekly') {
      if (weekdays.length === 0) return '未选星期'
      if (weekdays.length === 7) return '每日'
      if (weekdays.length === 5 && weekdays.every((d) => d >= 1 && d <= 5)) return '工作日'
      if (weekdays.length === 2 && weekdays.includes(6) && weekdays.includes(7)) return '周末'
      const names = weekdays.map((d) => WEEKDAY_OPTIONS.find((w) => w.value === d)?.label).filter(Boolean)
      return `每周${names.join('/')}`
    }
    if (frequencyType === 'monthly') {
      return formatMonthlyDays(monthDays)
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

    let finalWeekdays: number[] | undefined = undefined
    let finalMonthDays: number[] | undefined = undefined

    if (frequencyType === 'weekly') {
      finalWeekdays = weekdays
    } else if (frequencyType === 'monthly') {
      finalMonthDays = monthDays
    }

    onSave({
      id: habit ? habit.id : undefined,
      title: title.trim(),
      frequency: getFrequencyLabel(),
      frequencyType,
      weekdays: finalWeekdays,
      monthDays: finalMonthDays,
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
      {/* 贴底大卡片 · 延续 Rhythm 纯白与半深灰工业极简设计 */}
      <div
        className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 pt-3 space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col max-h-[90vh]"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部下拉手柄（支持下拉手势滑动关闭与点击手柄/遮罩关闭） */}
        <div
          className="flex items-center justify-center py-2 shrink-0 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div
            className="w-10 h-1 bg-zinc-200 hover:bg-zinc-300 rounded-full cursor-pointer transition-colors"
            onClick={onClose}
            title="下拉关闭"
          />
        </div>

        {/* 纯净习惯标题输入框 (固定置顶，脱离滚动截断) */}
        <div className="shrink-0 px-0.5 pt-0.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            autoFocus
            placeholder="习惯名称"
            className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400 transition-all"
          />
        </div>

        {/* 可滚动表单区域 */}
        <div className="space-y-3 overflow-y-auto no-scrollbar px-0.5 py-1">
          {/* 高精度时间标尺与时长联动轴 (与任务模块完全一致) */}
          <TimelineRibbon
            time={time}
            duration={duration}
            onChangeTime={setTime}
            onChangeDuration={setDuration}
          />

          {/* 重复频次设置模块 (对齐 Web 端每日/每周/每月能力) */}
          <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2.5">
            {/* 三大频次模式分段选择器 */}
            <div className="grid grid-cols-3 gap-1.5">
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
                    'py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border',
                    frequencyType === item.key
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                      : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 2. 每周模式：周一至周日 7 键纯粹点选 */}
            {frequencyType === 'weekly' && (
              <div className="pt-0.5 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_OPTIONS.map((w) => {
                    const isSelected = weekdays.includes(w.value)
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => toggleWeekday(w.value)}
                        className={cn(
                          'h-8.5 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center',
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

            {/* 3. 每月模式：手势画刷微历盘 (连续天数自动连结成黑胶囊) */}
            {frequencyType === 'monthly' && (
              <div className="pt-0.5 animate-in fade-in-50 duration-150">
                <MonthlyDayBrushPicker
                  selectedDays={monthDays}
                  onChange={setMonthDays}
                />
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
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all cursor-pointer"
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
