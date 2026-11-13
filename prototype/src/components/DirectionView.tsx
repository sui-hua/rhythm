import React from 'react'
import type { Goal } from '../types'
import { cn } from '../lib/utils'

interface DirectionViewProps {
  goals: Goal[]
  onClickGoal?: (goal: Goal) => void
}

export const DirectionView: React.FC<DirectionViewProps> = ({ goals, onClickGoal }) => {
  return (
    <section className="px-5 pt-3.5 space-y-2.5">
      {goals.map((goal) => (
        <div
          key={goal.id}
          onClick={() => onClickGoal?.(goal)}
          className="group p-4 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.99] space-y-3 border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-semibold">
                {goal.category}
              </span>
              <h2 className="text-[15.5px] font-semibold tracking-tight text-zinc-900 mt-1.5 truncate">{goal.title}</h2>
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

          <p className="text-xs text-zinc-500 font-medium truncate">{goal.milestone}</p>

          {/* 极细质感进度条 (Apple 规范 1.5 轨高) */}
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40">
            <div
              className="h-full bg-zinc-900 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, goal.progress))}%` }}
            ></div>
          </div>
        </div>
      ))}
    </section>
  )
}
