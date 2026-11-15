import React, { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'
import { TimelineRibbon } from '../TimelineRibbon'

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
const CARRY_OVER_OPTIONS = [1, 3, 5, 7]
const MONTH_LIST = Array.from({ length: 12 }, (_, i) => i + 1)

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

  // 12 个月微矩阵点击交互：智能选择起始与结束月份
  const handleSelectMonth = (m: number) => {
    // 如果当前选中的已经是单个月，且再次点击该月，保持该月
    if (startMonth === endMonth && startMonth === m) return

    // 如果点击的月份比当前起始月小，将起始月前移
    if (m < startMonth) {
      setStartMonth(m)
    } else if (m === startMonth) {
      // 点击了起始月，且已有区间，则收缩到单月
      setEndMonth(m)
    } else {
      // 点击了大于起始月的月份，将结束月扩展/调整为该月
      setEndMonth(m)
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

  const monthSpanCount = Math.max(1, endMonth - startMonth + 1)

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* 贴底大卡片 · 延续 Rhythm 纯白与半深灰工业极简设计 */}
      <div
        className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 pt-3 space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col max-h-[92vh]"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部手柄条与关闭按钮 (无冗余大标题) */}
        <div
          className="relative flex items-center justify-center py-2 shrink-0 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div
            className="w-10 h-1 bg-zinc-200 hover:bg-zinc-300 rounded-full cursor-pointer transition-colors"
            onClick={onClose}
            title="下拉或点击关闭"
          />
          <button
            type="button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="关闭"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 纯净目标标题输入 (固定置顶，脱离滚动截断) */}
        <div className="shrink-0 px-0.5 pt-0.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            autoFocus
            placeholder="目标名称"
            className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400 transition-all"
          />
        </div>

        {/* 可滚动表单区域 */}
        <div className="space-y-3 overflow-y-auto no-scrollbar px-0.5 py-1">
          {/* 高精度时间标尺与时长联动轴 (与任务/习惯完全统一) */}
          <TimelineRibbon
            time={time}
            duration={duration}
            onChangeTime={setTime}
            onChangeDuration={setDuration}
          />

          {/* 微卡片 1：周期规划与目标分类 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-3">
            {/* 月份周期标头 */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 tracking-wider">执行时轴</span>
              <span className="text-[11px] font-mono font-bold text-zinc-900 bg-white px-2 py-0.5 rounded-md border border-zinc-200/60 shadow-2xs">
                {startMonth}月 ~ {endMonth}月 ({monthSpanCount}个月)
              </span>
            </div>

            {/* 12 个月微矩阵：支持两端点击连结成纯黑胶囊 */}
            <div className="grid grid-cols-6 gap-y-1 gap-x-0 py-0.5 select-none">
              {MONTH_LIST.map((m) => {
                const isSelected = m >= startMonth && m <= endMonth
                const colIndex = (m - 1) % 6 // 0 ~ 5

                // 连通胶囊边界判断
                const hasLeft = colIndex > 0 && m - 1 >= startMonth && m - 1 <= endMonth
                const hasRight = colIndex < 5 && m + 1 >= startMonth && m + 1 <= endMonth

                let rounding = 'rounded-full'
                if (hasLeft && hasRight) {
                  rounding = 'rounded-none'
                } else if (!hasLeft && hasRight) {
                  rounding = 'rounded-l-full'
                } else if (hasLeft && !hasRight) {
                  rounding = 'rounded-r-full'
                }

                return (
                  <div
                    key={m}
                    onClick={() => handleSelectMonth(m)}
                    className="h-7.5 flex items-center justify-center relative cursor-pointer"
                  >
                    <div
                      className={cn(
                        'absolute inset-y-0.5 flex items-center justify-center transition-colors duration-100',
                        isSelected
                          ? 'bg-zinc-900 text-white shadow-xs z-10'
                          : 'bg-transparent text-zinc-600 hover:bg-zinc-200/60 rounded-full',
                        rounding,
                        hasLeft ? 'left-0' : 'left-0.5',
                        hasRight ? 'right-0' : 'right-0.5'
                      )}
                    >
                      <span
                        className={cn(
                          'font-mono text-[11px] leading-none tabular-nums',
                          isSelected ? 'font-bold text-white' : 'font-medium'
                        )}
                      >
                        {m}月
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 目标分类药丸 */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-200/50">
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

          {/* 微卡片 2：未完成顺延 Carry-Over */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">未完成顺延</span>
                <span className="text-[10px] text-zinc-400">当日未完成则次日时序日程自动延后提醒</span>
              </div>
              <div className="flex bg-zinc-200/60 p-0.5 rounded-xl text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCarryOverEnabled(false)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer',
                    !carryOverEnabled ? 'bg-white text-zinc-900 font-bold shadow-xs' : 'text-zinc-500'
                  )}
                >
                  关
                </button>
                <button
                  type="button"
                  onClick={() => setCarryOverEnabled(true)}
                  className={cn(
                    'px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer',
                    carryOverEnabled ? 'bg-zinc-900 text-white font-bold shadow-xs' : 'text-zinc-500'
                  )}
                >
                  开
                </button>
              </div>
            </div>

            {carryOverEnabled && (
              <div className="flex items-center justify-between pt-1.5 border-t border-zinc-200/50 animate-in fade-in-50 duration-150">
                <span className="text-[11px] text-zinc-500 font-medium">顺延周期</span>
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
              <span>同步更新月度战役的执行时间</span>
            </label>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="space-y-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all cursor-pointer"
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
