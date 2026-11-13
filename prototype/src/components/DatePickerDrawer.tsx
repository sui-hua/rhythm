import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Task } from '../types'
import { cn } from '../lib/utils'

interface DatePickerDrawerProps {
  currentDateObj: Date
  tasksByDate: Record<string, Task[]>
  isToday: boolean
  onClose: () => void
  onSelectDate: (date: Date) => void
  onSelectToday: () => void
}

export const DatePickerDrawer: React.FC<DatePickerDrawerProps> = ({
  currentDateObj,
  tasksByDate,
  isToday,
  onClose,
  onSelectDate,
  onSelectToday
}) => {
  const [pickerYear, setPickerYear] = useState(() => currentDateObj.getFullYear())
  const [pickerMonth, setPickerMonth] = useState(() => currentDateObj.getMonth())

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

  // 计算日历网格
  const firstDayWeekday = new Date(pickerYear, pickerMonth, 1).getDay()
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate()
  const prevDaysCount = new Date(pickerYear, pickerMonth, 0).getDate()

  interface CellData {
    day: number
    isCurrentMonth: boolean
    isSelected?: boolean
    isToday?: boolean
    hasTasks?: boolean
  }

  const cells: CellData[] = []

  // 上月占位
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    cells.push({ day: prevDaysCount - i, isCurrentMonth: false })
  }

  // 当月
  const selY = currentDateObj.getFullYear()
  const selM = currentDateObj.getMonth()
  const selD = currentDateObj.getDate()

  for (let d = 1; d <= daysInMonth; d++) {
    const isSel = pickerYear === selY && pickerMonth === selM && d === selD
    const isTod = pickerYear === 2026 && pickerMonth === 4 && d === 11
    const dateKey = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const hasT = Boolean(tasksByDate[dateKey] && tasksByDate[dateKey].length > 0)
    cells.push({
      day: d,
      isCurrentMonth: true,
      isSelected: isSel,
      isToday: isTod,
      hasTasks: hasT
    })
  }

  // 下月占位补足 7 的倍数
  let nextDay = 1
  while (cells.length % 7 !== 0) {
    cells.push({ day: nextDay++, isCurrentMonth: false })
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto"></div>

        {/* 标题与切换控制 */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold tracking-tight text-zinc-900 font-sans">
              {pickerYear}年 {pickerMonth + 1}月
            </span>
            <div className="flex items-center text-zinc-400 ml-1">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="p-1 hover:text-zinc-900 transition-colors"
                title="上个月"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="p-1 hover:text-zinc-900 transition-colors"
                title="下个月"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                type="button"
                onClick={() => {
                  onSelectToday()
                  onClose()
                }}
                className="px-2.5 py-1 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors active:scale-95"
              >
                回今天
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-900 p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 星期表头 */}
        <div className="grid grid-cols-7 text-center text-[11px] font-mono font-semibold text-zinc-400 pb-1">
          <span>日</span>
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
        </div>

        {/* 日历单元格网格 */}
        <div className="grid grid-cols-7 gap-y-1.5 text-center">
          {cells.map((cell, idx) => (
            <button
              key={idx}
              type="button"
              disabled={!cell.isCurrentMonth}
              onClick={() => {
                if (cell.isCurrentMonth) {
                  onSelectDate(new Date(pickerYear, pickerMonth, cell.day))
                  onClose()
                }
              }}
              className={cn(
                'relative w-9 h-9 mx-auto rounded-full flex flex-col items-center justify-center text-xs font-mono font-medium transition-all',
                !cell.isCurrentMonth
                  ? 'text-zinc-300 pointer-events-none'
                  : 'hover:bg-zinc-100',
                cell.isSelected
                  ? 'bg-zinc-900 text-white font-bold shadow-xs hover:bg-zinc-900 scale-105'
                  : 'text-zinc-800',
                cell.isToday && !cell.isSelected
                  ? 'font-bold border border-zinc-900 text-zinc-900'
                  : ''
              )}
            >
              <span>{cell.day}</span>
              {cell.hasTasks && !cell.isSelected && (
                <span className="w-1 h-1 rounded-full bg-zinc-400 absolute bottom-1"></span>
              )}
            </button>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="pt-1 text-center border-t border-zinc-100">
          <p className="text-[11px] font-medium text-zinc-400">轻触日期快速跳转 · 专注当下节奏</p>
        </div>
      </div>
    </div>
  )
}
