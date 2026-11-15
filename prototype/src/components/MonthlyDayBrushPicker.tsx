import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { cn } from '../lib/utils'

interface MonthlyDayBrushPickerProps {
  selectedDays: number[]
  onChange: (days: number[]) => void
}

const TOTAL_DAYS = 31
const ALL_DAYS = Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1)
const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日']

export const MonthlyDayBrushPicker: React.FC<MonthlyDayBrushPickerProps> = ({
  selectedDays,
  onChange
}) => {
  // 拖拽与画刷状态
  const [isDragging, setIsDragging] = useState(false)
  const [startDay, setStartDay] = useState<number | null>(null)
  const [currentHoverDay, setCurrentHoverDay] = useState<number | null>(null)
  const [dragAction, setDragAction] = useState<'add' | 'remove'>('add')

  // 用于识别触摸元素的目标容器
  const gridContainerRef = useRef<HTMLDivElement>(null)

  // 计算当前拖动产生的临时选中区间
  const previewRange = useMemo<number[]>(() => {
    if (!isDragging || startDay === null || currentHoverDay === null) return []
    const min = Math.min(startDay, currentHoverDay)
    const max = Math.max(startDay, currentHoverDay)
    const range: number[] = []
    for (let i = min; i <= max; i++) {
      range.push(i)
    }
    return range
  }, [isDragging, startDay, currentHoverDay])

  // 当前实时展示的高亮天数集合（已有集合结合拖拽画刷）
  const liveSelectedSet = useMemo<Set<number>>(() => {
    const set = new Set(selectedDays)
    if (previewRange.length > 0) {
      if (dragAction === 'add') {
        previewRange.forEach((d) => set.add(d))
      } else {
        previewRange.forEach((d) => set.delete(d))
      }
    }
    return set
  }, [selectedDays, previewRange, dragAction])

  // 根据坐标找到被触摸命中的天数
  const getDayFromPoint = useCallback((clientX: number, clientY: number): number | null => {
    const el = document.elementFromPoint(clientX, clientY)
    const dayEl = el?.closest('[data-day]')
    if (dayEl) {
      const val = parseInt(dayEl.getAttribute('data-day') || '', 10)
      if (!isNaN(val) && val >= 1 && val <= 31) {
        return val
      }
    }
    return null
  }, [])

  // 鼠标操作
  const handleMouseDown = (day: number) => {
    setIsDragging(true)
    setStartDay(day)
    setCurrentHoverDay(day)
    setDragAction(selectedDays.includes(day) ? 'remove' : 'add')
  }

  const handleMouseEnter = (day: number) => {
    if (isDragging) {
      setCurrentHoverDay(day)
    }
  }

  // 结束拖拽，提交结果
  const finishDrag = useCallback(() => {
    if (isDragging) {
      onChange(Array.from(liveSelectedSet).sort((a, b) => a - b))
    }
    setIsDragging(false)
    setStartDay(null)
    setCurrentHoverDay(null)
  }, [isDragging, liveSelectedSet, onChange])

  // 触摸操作（支持手机端画刷一抹连选）
  const handleTouchStart = (_e: React.TouchEvent, day: number) => {
    setIsDragging(true)
    setStartDay(day)
    setCurrentHoverDay(day)
    setDragAction(selectedDays.includes(day) ? 'remove' : 'add')
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const hitDay = getDayFromPoint(touch.clientX, touch.clientY)
    if (hitDay !== null && hitDay !== currentHoverDay) {
      setCurrentHoverDay(hitDay)
    }
  }

  // 监听全局松开事件，确保拖到容器外面也能正确结束
  useEffect(() => {
    const handleGlobalUp = () => {
      if (isDragging) {
        finishDrag()
      }
    }
    window.addEventListener('mouseup', handleGlobalUp)
    window.addEventListener('touchend', handleGlobalUp)
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp)
      window.removeEventListener('touchend', handleGlobalUp)
    }
  }, [isDragging, finishDrag])



  return (
    <div className="space-y-2.5 select-none">
      {/* 星期指示标头（极简细灰字） */}
      <div className="grid grid-cols-7 text-center">
        {WEEK_HEADERS.map((w, idx) => (
          <span
            key={w}
            className={cn(
              'text-[10px] font-medium py-1 font-sans',
              idx >= 5 ? 'text-zinc-500 font-semibold' : 'text-zinc-400'
            )}
          >
            {w}
          </span>
        ))}
      </div>

      {/* 31 天高质感月历画刷网格 */}
      <div
        ref={gridContainerRef}
        onTouchMove={handleTouchMove}
        className="grid grid-cols-7 gap-y-1 gap-x-0 relative touch-none py-0.5"
      >
        {ALL_DAYS.map((day) => {
          const colIndex = (day - 1) % 7 // 0 ~ 6 代表列
          const isSelected = liveSelectedSet.has(day)

          // 连通胶囊边界判断：只在同一行内左右连续连通
          const hasLeft = colIndex > 0 && liveSelectedSet.has(day - 1)
          const hasRight = colIndex < 6 && day < TOTAL_DAYS && liveSelectedSet.has(day + 1)

          // 胶囊各节点圆角类名
          let capsuleRounding = 'rounded-full'
          if (hasLeft && hasRight) {
            capsuleRounding = 'rounded-none'
          } else if (!hasLeft && hasRight) {
            capsuleRounding = 'rounded-l-full'
          } else if (hasLeft && !hasRight) {
            capsuleRounding = 'rounded-r-full'
          }

          return (
            <div
              key={day}
              data-day={day}
              onMouseDown={() => handleMouseDown(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              onTouchStart={(e) => handleTouchStart(e, day)}
              className="h-8.5 flex items-center justify-center relative cursor-pointer group"
            >
              {/* 胶囊背景底色层：连续选中的日期无缝贴合形成黑缎带 */}
              <div
                className={cn(
                  'absolute inset-y-0.5 flex items-center justify-center transition-colors duration-100',
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-xs z-10'
                    : 'bg-transparent text-zinc-600 hover:bg-zinc-200/60 rounded-full',
                  capsuleRounding,
                  // 针对左右连通项横向贴紧边缘消除间隙
                  hasLeft ? 'left-0' : 'left-0.5',
                  hasRight ? 'right-0' : 'right-0.5'
                )}
              >
                <span
                  className={cn(
                    'font-mono text-[12px] leading-none tabular-nums select-none',
                    isSelected ? 'font-bold text-white' : 'font-medium'
                  )}
                >
                  {day}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
