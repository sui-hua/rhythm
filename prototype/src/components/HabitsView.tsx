import React, { useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Habit } from '../types'

interface HabitsViewProps {
  habits: Habit[]
  onClickHabit: (habit: Habit) => void
  onToggleHabit?: (habit: Habit) => void
  onEditHabit?: (habit: Habit) => void
}

interface HabitCardProps {
  habit: Habit
  onClickHabit: (habit: Habit) => void
  onEditHabit?: (habit: Habit) => void
}

/**
 * 周期文本简化提取：严格按规范只显示「每日」、「每周」、「每月」，不写细节
 */
const getSimpleCycle = (habit: Habit): string => {
  if (habit.frequencyType === 'daily' || habit.frequency?.includes('日')) return '每日'
  if (habit.frequencyType === 'weekly' || habit.frequency?.includes('周')) return '每周'
  if (habit.frequencyType === 'monthly' || habit.frequency?.includes('月')) return '每月'
  return '每日'
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onClickHabit, onEditHabit }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)

  const handlePressStart = () => {
    isLongPressRef.current = false
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        window.navigator.vibrate(40)
      }
      onEditHabit?.(habit)
    }, 450)
  }

  const handlePressEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault()
      e.stopPropagation()
      isLongPressRef.current = false
      return
    }
    onClickHabit(habit)
  }

  // 累计坚持天数统计
  const totalDays = habit.totalYear || habit.completedDays?.length || 0

  return (
    <div
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchMove={handlePressEnd}
      onContextMenu={(e) => {
        if (onEditHabit) {
          e.preventDefault()
          onEditHabit(habit)
        }
      }}
      onClick={handleClick}
      className="group px-4.5 py-4 rounded-2xl bg-white border border-transparent shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer active:scale-[0.99] select-none flex items-center justify-between gap-3"
      title="轻点查看月度热力档案，长按编辑习惯设置"
    >
      {/* 习惯主标题 + 简化周期 (每日/每周/每月，不写细节) */}
      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
        <h2 className="text-[15.5px] font-semibold tracking-tight text-zinc-950 group-hover:text-black truncate">
          {habit.title}
        </h2>
        <span className="text-[12px] text-zinc-400 font-normal shrink-0">
          · {getSimpleCycle(habit)}
        </span>
      </div>

      {/* 右侧：天数 + 轻量进入微箭头 */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[13px] font-mono font-semibold text-zinc-400 group-hover:text-zinc-600 transition-colors">
          {totalDays} 天
        </span>
        <ChevronRight
          size={15}
          className="text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </div>
  )
}

/**
 * 方案 A：独立单行微卡流 (习惯资产大盘与节律管理中心)
 * - 纯粹单行独立微卡，与所向大盘 100% 视觉对齐；
 * - 周期简化为「每日 / 每周 / 每月」，不写细节；
 * - 右侧展示「累计 X 天」；
 * - 轻点推入月度打卡热力图档案，长按呼出习惯设置抽屉。
 */
export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onClickHabit,
  onEditHabit,
  onToggleHabit: _onToggleHabit
}) => {
  return (
    <section className="px-5 pt-3.5 space-y-2.5 pb-24">
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onClickHabit={onClickHabit}
          onEditHabit={onEditHabit}
        />
      ))}

      {habits.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <p className="text-xs text-zinc-400 font-medium tracking-tight">
            暂无习惯，点击下方 + 开始追踪
          </p>
        </div>
      )}
    </section>
  )
}
