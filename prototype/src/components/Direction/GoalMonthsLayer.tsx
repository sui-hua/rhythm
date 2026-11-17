import React from 'react'
import { ChevronRight } from 'lucide-react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'

interface GoalMonthsLayerProps {
  goal: Goal
  onSelectMonth: (monthId: number | string) => void
}

/**
 * 第二层：月度战役路线图
 * 像外层一样独立成卡 (space-y-3)，最左侧贯穿发丝级时间轴与节点：
 * ● 05月  战役主标题                           60% >
 * │
 * ○ 06月  战役主标题                               >
 */
export const GoalMonthsLayer: React.FC<GoalMonthsLayerProps> = ({
  goal,
  onSelectMonth
}) => {
  const months = goal.months || []

  return (
    <div className="px-5 pt-3.5 pb-24 space-y-3 animate-in slide-in-from-right duration-200">
      {months.map((month, idx) => {
        const isLast = idx === months.length - 1
        const isMay = month.month === 5 // 模拟当前基准月份为 5 月
        const mDays = month.days || []
        const completedCount = mDays.filter((d) => d.completed).length
        const totalCount = mDays.length
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
        const hasProgress = progress > 0

        return (
          <div
            key={month.id}
            onClick={() => onSelectMonth(month.id)}
            className="group relative px-4.5 py-4 rounded-2xl bg-white border border-transparent shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-200 cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3"
          >
            {/* 时间轴垂直线：从当前卡片节点中心无缝穿过间隙连接到下一张卡片节点 */}
            {!isLast && (
              <div className="absolute left-[22.25px] top-1/2 h-[calc(100%+12px)] w-[1.5px] bg-zinc-200 pointer-events-none z-0" />
            )}

            {/* 左侧：时间轴节点 + 月份 */}
            <div className="relative z-10 flex items-center gap-2.5 shrink-0">
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-125 shrink-0',
                  isMay
                    ? 'bg-zinc-950 ring-4 ring-white shadow-xs'
                    : 'border-[1.5px] border-zinc-300 bg-white ring-4 ring-white group-hover:border-zinc-500'
                )}
              />
              <span
                className={cn(
                  'text-[13px] font-mono font-bold transition-colors',
                  isMay ? 'text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-700'
                )}
              >
                {String(month.month).padStart(2, '0')}月
              </span>
            </div>

            {/* 中间：战役主名称 (单行展开，纯粹舒展) */}
            <h3
              className={cn(
                'text-[15px] font-medium tracking-tight truncate flex-1 transition-colors pr-1',
                month.title
                  ? isMay
                    ? 'text-zinc-950 font-semibold'
                    : 'text-zinc-800 group-hover:text-black'
                  : 'text-zinc-400 italic font-normal'
              )}
            >
              {month.title || '点此规划本月战役...'}
            </h3>

            {/* 右侧：纯净等宽完成度 + 轻量推进箭头 */}
            <div className="relative z-10 flex items-center gap-2 shrink-0">
              {hasProgress && (
                <span className="text-[13px] font-mono font-bold text-zinc-950">
                  {progress}%
                </span>
              )}
              <ChevronRight
                size={15}
                className="text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all"
              />
            </div>
          </div>
        )
      })}

      {months.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-xs text-zinc-400 font-medium tracking-tight">暂无月度战役划分</p>
        </div>
      )}
    </div>
  )
}
