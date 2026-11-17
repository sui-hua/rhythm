import React, { useMemo, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Habit } from '../types'
import { cn } from '../lib/utils'

interface HabitDetailModalProps {
  habit: Habit
  onClose: () => void
  onEdit: (habit: Habit) => void
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  onClose,
  onEdit
}) => {
  const [pickerYear, setPickerYear] = useState(2026)
  const [pickerMonth, setPickerMonth] = useState(4) // 4 = 5月 (0-indexed)
  const [selectedDateStr, setSelectedDateStr] = useState('2026-05-11') // 默认选中今天

  const monthPrefix = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}`

  // 当月打卡天数统计
  const monthCompletedCount = useMemo(() => {
    return habit.completedDays.filter((d) => d.startsWith(monthPrefix)).length
  }, [habit.completedDays, monthPrefix])

  // 当前选中日期的打卡记录
  const selectedLog = useMemo(() => {
    return habit.logs.find((l) => l.date === selectedDateStr) || null
  }, [habit.logs, selectedDateStr])


  // 下拉关闭手势状态
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef<number>(0)

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
    setIsDragging(false)
    if (dragY > 60) {
      onClose()
    }
    setDragY(0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY
    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientY - startY
      if (delta > 0) {
        setDragY(delta)
      }
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      setDragY((cur) => {
        if (cur > 60) {
          onClose()
        }
        return 0
      })
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const changeMonth = (delta: number) => {
    let nextM = pickerMonth + delta
    let nextY = pickerYear
    if (nextM > 11) {
      nextM = 0
      nextY++
    } else if (nextM < 0) {
      nextM = 11
      nextY--
    }
    setPickerMonth(nextM)
    setPickerYear(nextY)
  }

  // 生成日历格子
  const firstDayWeekday = new Date(pickerYear, pickerMonth, 1).getDay()
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate()
  const prevDaysCount = new Date(pickerYear, pickerMonth, 0).getDate()

  interface CellData {
    day: number
    dateStr: string
    isCurrentMonth: boolean
    isCompleted: boolean
    isToday: boolean
    isSelected: boolean
  }

  const cells: CellData[] = []

  // 上月占位格
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const d = prevDaysCount - i
    const prevMonthIdx = pickerMonth === 0 ? 11 : pickerMonth - 1
    const prevYear = pickerMonth === 0 ? pickerYear - 1 : pickerYear
    const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isCompleted: habit.completedDays.includes(dateStr),
      isToday: false,
      isSelected: selectedDateStr === dateStr
    })
  }

  // 当月格子
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = pickerYear === 2026 && pickerMonth === 4 && d === 11
    cells.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isCompleted: habit.completedDays.includes(dateStr),
      isToday,
      isSelected: selectedDateStr === dateStr
    })
  }

  // 下月补齐
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const nextMonthIdx = pickerMonth === 11 ? 0 : pickerMonth + 1
    const nextYear = pickerMonth === 11 ? pickerYear + 1 : pickerYear
    const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`
    cells.push({
      day: nextDay++,
      dateStr,
      isCurrentMonth: false,
      isCompleted: habit.completedDays.includes(dateStr),
      isToday: false,
      isSelected: selectedDateStr === dateStr
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* 底部贴底原生大卡片 (Page Sheet 架构 · 视觉饱满舒展) */}
      <div
        className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部下拉手柄（支持手势下拉与点击关闭） */}
        <div
          className="flex items-center justify-center -mt-2 pb-1 shrink-0 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div
            className="w-10 h-1 bg-zinc-200 hover:bg-zinc-300 rounded-full cursor-pointer transition-colors"
            onClick={onClose}
            title="下拉关闭"
          />
        </div>

        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-0.5 shrink-0">
          <h2 className="text-[18px] font-bold tracking-tight text-zinc-900 leading-tight">
            {habit.title}
          </h2>
        </div>

        {/* 4 维指标微卡片（无冗余大标题，紧凑精致） */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          <div className="bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[10.5px] font-medium text-zinc-400">本月打卡</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-zinc-900">{monthCompletedCount}</span>
              <span className="text-[11px] text-zinc-500 font-medium">天</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-xl flex flex-col justify-between">
            <span className="text-[10.5px] font-medium text-zinc-400">当前连击</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-zinc-900">{habit.streak}</span>
              <span className="text-[11px] text-zinc-500 font-medium">天</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-xl flex flex-col justify-between">
            <span className="text-[10.5px] font-medium text-zinc-400">完成率</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-zinc-900">{habit.completionRate}</span>
              <span className="text-[11px] text-zinc-500 font-medium">%</span>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-xl flex flex-col justify-between">
            <span className="text-[10.5px] font-medium text-zinc-400">年度总计</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold font-mono text-zinc-900">{habit.totalYear}</span>
              <span className="text-[11px] text-zinc-500 font-medium">天</span>
            </div>
          </div>
        </div>

        {/* 方案 1 核心：打卡月历即索引（底部大卡片宽度充裕，7 列格子自然舒展） */}
        <div className="bg-zinc-50/70 border border-zinc-200/70 p-3.5 rounded-2xl space-y-2.5 shrink-0 select-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 font-sans">
              {pickerYear}年 {pickerMonth + 1}月
            </span>
            <div className="flex items-center text-zinc-400 gap-0.5">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="p-1 hover:text-zinc-800 transition-colors cursor-pointer"
                title="上个月"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="p-1 hover:text-zinc-800 transition-colors cursor-pointer"
                title="下个月"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* 星期表头 */}
          <div className="grid grid-cols-7 text-center text-[10px] font-mono font-semibold text-zinc-400">
            <span>日</span>
            <span>一</span>
            <span>二</span>
            <span>三</span>
            <span>四</span>
            <span>五</span>
            <span>六</span>
          </div>

          {/* 日历格子：轻触任意日期，下方卡片联动展示当天情况 */}
          <div className="grid grid-cols-7 gap-y-1.5 text-center">
            {cells.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={cn(
                  'relative w-8 h-8 mx-auto rounded-full flex items-center justify-center text-[11px] font-mono font-medium transition-all cursor-pointer active:scale-95',
                  !cell.isCurrentMonth && 'opacity-25',
                  cell.isCompleted
                    ? 'bg-zinc-900 text-white font-bold shadow-xs hover:bg-zinc-800'
                    : 'text-zinc-600 hover:bg-zinc-200/60',
                  cell.isToday && !cell.isCompleted && 'border-[1.5px] border-zinc-900 font-bold',
                  cell.isSelected && 'ring-2 ring-zinc-900 ring-offset-1 scale-105 z-10'
                )}
                title={`${cell.dateStr} - 点击查看记录`}
              >
                <span>{cell.day}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 底部备注区域：纯粹直接展示备注内容 */}
        <div className="px-3.5 py-3 min-h-[44px] flex items-center rounded-2xl bg-zinc-50 border border-zinc-200/60 shrink-0">
          <p
            className={cn(
              'text-xs leading-relaxed',
              selectedLog?.note ? 'text-zinc-800 font-medium' : 'text-zinc-400'
            )}
          >
            {selectedLog?.note || '暂无备注'}
          </p>
        </div>

        {/* 底部操作按钮 */}
        <div className="pt-0.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit(habit)
            }}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            编辑此习惯
          </button>
        </div>
      </div>
    </div>
  )
}
