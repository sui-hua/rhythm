import React, { useState } from 'react'
import { Sparkles, CheckCircle2, Flame } from 'lucide-react'
import type { PeriodType } from '../../types'

export interface SummarySavePayload {
  period: PeriodType
  text: string
  done: string
  improve: string
  tomorrow: string
}

interface SummaryModalProps {
  period: PeriodType
  completedTasksCount?: number
  totalTasksCount?: number
  completedHabitsCount?: number
  completedTaskTitles?: string[]
  onClose: () => void
  onSave: (data: SummarySavePayload) => void
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  period,
  completedTasksCount = 4,
  totalTasksCount = 6,
  completedHabitsCount = 2,
  completedTaskTitles = ['晨间专注阅读', '架构方案设计'],
  onClose,
  onSave
}) => {
  const [done, setDone] = useState('')
  const [improve, setImprove] = useState('')
  const [tomorrow, setTomorrow] = useState('')

  const completionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0

  const canSubmit = done.trim().length > 0 || improve.trim().length > 0 || tomorrow.trim().length > 0

  const handleSave = () => {
    if (!canSubmit) return
    const combinedText = [
      done.trim() ? `【今日成就】${done.trim()}` : '',
      improve.trim() ? `【改进反思】${improve.trim()}` : '',
      tomorrow.trim() ? `【明日焦点】${tomorrow.trim()}` : ''
    ]
      .filter(Boolean)
      .join('\n')

    onSave({
      period,
      text: combinedText,
      done: done.trim(),
      improve: improve.trim(),
      tomorrow: tomorrow.trim()
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[390px] max-h-[90vh] bg-[#f2f2f7] rounded-t-[32px] shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-200 flex flex-col overflow-hidden">
        {/* iOS 经典手柄 */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 bg-zinc-300 rounded-full" />
        </div>

        {/* iOS 原生导航栏：取消 · 标题 · 完成 */}
        <div className="px-4 py-2 flex items-center justify-between shrink-0 border-b border-zinc-200/60 bg-[#f2f2f7]">
          <button
            type="button"
            onClick={onClose}
            className="text-[16px] text-zinc-500 hover:text-zinc-800 active:opacity-60 transition-opacity cursor-pointer font-normal"
          >
            取消
          </button>
          <h2 className="text-[16.5px] font-semibold tracking-tight text-zinc-900 font-sans">
            {period === '日' ? '今日深度复盘' : `${period}度复盘反思`}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="text-[16px] font-semibold text-zinc-900 disabled:text-zinc-300 active:opacity-60 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            完成
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* Group 1：今日数据自动概览卡片 (iOS Grouped 岛屿) */}
          {period === '日' && (
            <div className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <Sparkles size={13} className="text-amber-500" />
                <span>今日数据概览 (系统自动提取)</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
                  <span className="text-[10.5px] text-zinc-400 font-medium">事项达成</span>
                  <p className="text-base font-bold font-mono text-zinc-900 mt-0.5">
                    {completedTasksCount}/{totalTasksCount}
                  </p>
                </div>
                <div className="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
                  <span className="text-[10.5px] text-zinc-400 font-medium">完成率</span>
                  <p className="text-base font-bold font-mono text-zinc-900 mt-0.5">{completionRate}%</p>
                </div>
                <div className="bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-100">
                  <span className="text-[10.5px] text-zinc-400 font-medium">习惯打卡</span>
                  <p className="text-base font-bold font-mono text-zinc-900 mt-0.5">
                    {completedHabitsCount} 个
                  </p>
                </div>
              </div>

              {completedTaskTitles.length > 0 && (
                <div className="pt-2 border-t border-zinc-100 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10.5px] text-zinc-400 shrink-0">已完成:</span>
                  {completedTaskTitles.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10.5px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 truncate max-w-[130px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Group 2：三段式反思 Inset Grouped 岛屿 */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] divide-y divide-zinc-100 overflow-hidden text-[15px]">
            {/* 1. 今日成就 */}
            <div className="p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 size={13} />
                <span>1. 今日成就 (突破与高光)</span>
              </div>
              <textarea
                value={done}
                onChange={(e) => setDone(e.target.value)}
                rows={2}
                placeholder="今天完成了哪些重要事情？做成了什么？"
                className="w-full bg-transparent text-[15px] font-normal text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* 2. 改进之处 */}
            <div className="p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                <span className="font-bold text-[12px]">💡</span>
                <span>2. 改进之处 (偏差与防范)</span>
              </div>
              <textarea
                value={improve}
                onChange={(e) => setImprove(e.target.value)}
                rows={2}
                placeholder="哪里偏离了节奏？存在什么阻碍？"
                className="w-full bg-transparent text-[15px] font-normal text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* 3. 明日计划 */}
            <div className="p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <Flame size={13} />
                <span>3. 明日焦点 (睁眼头等大事)</span>
              </div>
              <textarea
                value={tomorrow}
                onChange={(e) => setTomorrow(e.target.value)}
                rows={2}
                placeholder="明天最优先处理、必须拿下的 1~3 件事..."
                className="w-full bg-transparent text-[15px] font-normal text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
