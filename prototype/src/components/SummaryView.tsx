import React from 'react'
import { BookOpen } from 'lucide-react'
import type { PeriodType, Summary } from '../types'
import { cn } from '../lib/utils'

interface SummaryViewProps {
  summaries: Summary[]
  activePeriod: PeriodType
  onSelectPeriod: (period: PeriodType) => void
  onClickSummary?: (summary: Summary) => void
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summaries,
  activePeriod,
  onSelectPeriod,
  onClickSummary
}) => {
  return (
    <section className="px-5 pt-3 space-y-3 pb-24">
      {/* 方案 1：水平撑满的高级内嵌分段滑块 (日 · 周 · 月 · 年) */}
      <div className="w-full bg-zinc-200/60 p-1 rounded-2xl flex items-center shadow-2xs">
        {(['日', '周', '月', '年'] as PeriodType[]).map((p) => {
          const isActive = activePeriod === p
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSelectPeriod(p)}
              className={cn(
                'flex-1 py-1.5 text-center text-[13px] rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-[0.98]',
                isActive
                  ? 'bg-white text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-500 font-medium hover:text-zinc-800'
              )}
            >
              {p}
            </button>
          )
        })}
      </div>

      {/* 沉浸日志流卡片列表 */}
      <div className="space-y-2.5">
        {summaries.map((item) => (
          <article
            key={item.id}
            onClick={() => onClickSummary?.(item)}
            className="p-4.5 rounded-2xl transition-all duration-200 cursor-pointer space-y-2 border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)] active:scale-[0.99] select-none"
          >
            {/* 纯净日期大标题 (彻底去除"日复盘"等废话标签) */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[14.5px] text-zinc-900 tracking-tight">
                {item.date}
              </span>
            </div>

            {/* 复盘文字正文 (纯粹反思心得) */}
            <p className="text-[13.5px] text-zinc-600 leading-relaxed font-normal">
              {item.text}
            </p>
          </article>
        ))}

        {summaries.length === 0 && (
          <div className="py-20 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white shadow-2xs text-zinc-300 flex items-center justify-center mx-auto">
              <BookOpen size={18} strokeWidth={1.5} />
            </div>
            <p className="text-xs text-zinc-400 font-medium tracking-tight">
              暂无此周期的复盘记录
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
