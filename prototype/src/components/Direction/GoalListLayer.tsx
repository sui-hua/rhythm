import React, { useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'

interface GoalListLayerProps {
  goals: Goal[]
  onSelectGoal: (goalId: number) => void
  onEditGoal?: (goal: Goal) => void
}

interface GoalListItemProps {
  goal: Goal
  onSelectGoal: (goalId: number) => void
  onEditGoal?: (goal: Goal) => void
}

const GoalListItem: React.FC<GoalListItemProps> = ({ goal, onSelectGoal, onEditGoal }) => {
  const isDone = goal.progress >= 100
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)

  const handlePressStart = () => {
    isLongPressRef.current = false
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        window.navigator.vibrate(40)
      }
      onEditGoal?.(goal)
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
    onSelectGoal(goal.id)
  }

  return (
    <div
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchMove={handlePressEnd}
      onContextMenu={(e) => {
        e.preventDefault()
        onEditGoal?.(goal)
      }}
      onClick={handleClick}
      className="group px-4.5 py-4 rounded-2xl bg-white border border-transparent shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer active:scale-[0.99] select-none flex items-center justify-between gap-3"
      title="轻点进入月度战役，长按打开目标设置"
    >
      {/* 目标大字主标题 */}
      <h2 className="text-[15.5px] font-semibold tracking-tight text-zinc-950 group-hover:text-black truncate flex-1 pr-2">
        {goal.title}
      </h2>

      {/* 右侧：纯净等宽完成度 + 轻量推进箭头 */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            'text-[13px] font-mono font-semibold transition-colors',
            isDone ? 'text-zinc-950 font-bold' : 'text-zinc-400 group-hover:text-zinc-600'
          )}
        >
          {goal.progress}%
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
 * 选项 3：独立单行微卡（极致克制 · 统一步调）
 * 每一项均为呼吸感独立卡片 (space-y-2.5)，纯粹大字主标题 + 等宽完成度 + 轻量进入箭头
 * 支持长按打开目标设置抽屉
 */
export const GoalListLayer: React.FC<GoalListLayerProps> = ({
  goals,
  onSelectGoal,
  onEditGoal
}) => {
  return (
    <section className="px-5 pt-3.5 space-y-2.5 pb-24">
      {goals.map((goal) => (
        <GoalListItem
          key={goal.id}
          goal={goal}
          onSelectGoal={onSelectGoal}
          onEditGoal={onEditGoal}
        />
      ))}

      {goals.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-xs text-zinc-400 font-medium tracking-tight">
            暂无长期目标，点击下方 + 确立方向
          </p>
        </div>
      )}
    </section>
  )
}
