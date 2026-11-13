import React from 'react'
import { BookOpen } from 'lucide-react'
import type { Summary } from '../types'

interface SummaryViewProps {
  summaries: Summary[]
  onClickSummary?: (summary: Summary) => void
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summaries, onClickSummary }) => {
  return (
    <section className="px-5 pt-3.5 space-y-2.5">
      {summaries.map((item) => (
        <article
          key={item.id}
          onClick={() => onClickSummary?.(item)}
          className="p-4 rounded-2xl transition-all duration-200 cursor-pointer space-y-2.5 border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="font-bold text-[14px] text-zinc-900 tracking-tight">{item.date}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
              {item.period}复盘
            </span>
          </div>
          <p className="text-[14px] text-zinc-700 leading-relaxed font-normal">{item.text}</p>
        </article>
      ))}

      {summaries.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-white shadow-xs text-zinc-400 flex items-center justify-center mx-auto">
            <BookOpen size={18} />
          </div>
          <p className="text-xs text-zinc-400 font-medium tracking-tight">暂无此周期的复盘记录</p>
        </div>
      )}
    </section>
  )
}
