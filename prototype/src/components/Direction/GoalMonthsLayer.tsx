import React from 'react'
import { ArrowLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'

interface GoalMonthsLayerProps {
  goal: Goal
  onBack: () => void
  onEditGoal: (goal: Goal) => void
  onSelectMonth: (monthId: number | string) => void
}

/**
 * 第二层：月度战役分解列表 (Things 3 Monthly Campaigns)
 * 不重复展示第一层的战略总目标概览大卡片，只保留标头与直接的月度战役列表
 */
export const GoalMonthsLayer: React.FC<GoalMonthsLayerProps> = ({
  goal,
  onBack,
  onEditGoal,
  onSelectMonth
}) => {
  const months = goal.months || []

  return (
    <div className="px-5 pt-2 pb-16 space-y-3.5 animate-in slide-in-from-right duration-200">
      {/* 顶部面包屑返回条 */}
      <div className="flex items-center justify-between pb-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft size={14} />
          <span>全部目标</span>
        </button>
        <button
          type="button"
          onClick={() => onEditGoal(goal)}
          className="text-zinc-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer"
          title="编辑目标周期与属性"
        >
          <SlidersHorizontal size={14} />
        </button>
      </div>

      {/* 标题区 (非卡片，仅呈现当前目标名称与总进度，不重复展示总目标概览大卡) */}
      <div className="pt-0.5 pb-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-bold tracking-tight text-zinc-900 truncate">
            {goal.title}
          </h1>
          <span className="text-xs font-mono font-bold text-zinc-400 shrink-0">
            {goal.progress}%
          </span>
        </div>
      </div>

      {/* 月度战役阶段列表 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            月度战役分解 ({months.length} 个阶段)
          </span>
          <span className="text-[10px] text-zinc-400">点击进入执行清单</span>
        </div>

        <div className="space-y-2">
          {months.map((month) => {
            const mDays = month.days || []
            const completedCount = mDays.filter((d) => d.completed).length
            const totalCount = mDays.length
            const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
            const isMay = month.month === 5 // 当前模拟基准月份为 5 月

            return (
              <div
                key={month.id}
                onClick={() => onSelectMonth(month.id)}
                className="group p-4 rounded-2xl bg-white border border-zinc-200/80 shadow-2xs hover:shadow-xs hover:border-zinc-300 transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* 月份徽标 */}
                  <span
                    className={cn(
                      'text-xs font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors',
                      isMay ? 'bg-zinc-900 text-white shadow-xs' : 'bg-zinc-100 text-zinc-700'
                    )}
                  >
                    {month.month < 10 ? '0' + month.month : month.month}月
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h3
                        className={cn(
                          'text-sm font-semibold tracking-tight truncate',
                          month.title ? 'text-zinc-900' : 'text-zinc-400 italic font-normal'
                        )}
                      >
                        {month.title || '点此分配本月核心战役...'}
                      </h3>
                      {isMay && (
                        <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 shrink-0">
                          进行中
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span>
                        {totalCount > 0 ? `已达成 ${completedCount}/${totalCount} 天` : '暂未规划任务'}
                      </span>
                      {totalCount > 0 && <span>·</span>}
                      {totalCount > 0 && <span className="font-semibold text-zinc-700">{progress}%</span>}
                    </div>
                  </div>
                </div>

                <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors shrink-0" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
