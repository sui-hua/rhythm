import React from 'react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'

interface GoalListLayerProps {
  goals: Goal[]
  onSelectGoal: (goalId: number) => void
}

/**
 * 第一层：战略目标总览 (Things 3 Goals List)
 */
export const GoalListLayer: React.FC<GoalListLayerProps> = ({ goals, onSelectGoal }) => {
  return (
    <section className="px-5 pt-3.5 space-y-2.5">
      {goals.map((goal) => {
        const mayMonth = goal.months?.find((m) => m.month === 5)
        const displayMilestone = mayMonth?.title ? `5月：${mayMonth.title}` : goal.milestone
        const mayDays = mayMonth?.days || []
        const mayCompleted = mayDays.filter((d) => d.completed).length

        return (
          <div
            key={goal.id}
            onClick={() => onSelectGoal(goal.id)}
            className="group p-4 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.99] space-y-3 border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-semibold">
                    {goal.category}
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-400">
                    {goal.startMonth}月 ~ {goal.endMonth}月
                  </span>
                </div>
                <h2 className="text-[15.5px] font-semibold tracking-tight text-zinc-900 mt-1.5 truncate">
                  {goal.title}
                </h2>
              </div>
              <span
                className={cn(
                  'text-[12px] font-mono font-bold px-2.5 py-0.5 rounded-md shrink-0 transition-colors',
                  goal.progress >= 100 ? 'bg-zinc-900 text-white shadow-xs' : 'bg-zinc-100 text-zinc-800'
                )}
              >
                {goal.progress}%
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
              <p className="truncate flex-1 pr-2">{displayMilestone}</p>
              {mayDays.length > 0 && (
                <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                  本月 {mayCompleted}/{mayDays.length} 天
                </span>
              )}
            </div>

            {/* 极细质感进度条 */}
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
              />
            </div>
          </div>
        )
      })}
    </section>
  )
}
