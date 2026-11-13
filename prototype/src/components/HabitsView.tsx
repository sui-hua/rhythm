import React from 'react'
import type { Habit } from '../types'
import { cn } from '../lib/utils'

interface HabitsViewProps {
  habits: Habit[]
  onClickHabit: (habit: Habit) => void
  onToggleHabit?: (habit: Habit) => void
}

export const HabitsView: React.FC<HabitsViewProps> = ({ habits, onClickHabit }) => {
  return (
    <section className="px-5 pt-3.5 space-y-2.5">
      {habits.map((habit) => (
        <div
          key={habit.id}
          onClick={() => onClickHabit(habit)}
          className="group p-4 rounded-2xl bg-white border border-transparent shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer active:scale-[0.99] space-y-1.5"
        >
          {/* 第一行：习惯标题 + 右侧连续天数徽标 */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15.5px] font-semibold tracking-tight text-zinc-900 truncate">
              {habit.title}
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 shrink-0">
              连续 {habit.streak} 天
            </span>
          </div>

          {/* 第二行：频次规则 + 右侧状态/完成率 */}
          <div className="flex items-center justify-between text-xs text-zinc-400 font-medium">
            <span className="text-zinc-500 font-sans">{habit.frequency}</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  habit.completedToday ? 'bg-emerald-500' : 'bg-zinc-300'
                )}
              />
              <span className={habit.completedToday ? 'text-zinc-600' : 'text-zinc-400'}>
                {habit.completedToday ? '今日已达成' : '完成率 ' + habit.completionRate + '%'}
              </span>
            </div>
          </div>
        </div>
      ))}

      {habits.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <p className="text-xs text-zinc-400 font-medium tracking-tight">暂无习惯，点击下方 + 开始追踪</p>
        </div>
      )}
    </section>
  )
}
