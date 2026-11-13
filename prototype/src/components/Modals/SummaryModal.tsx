import React, { useState } from 'react'
import { X } from 'lucide-react'
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
      <div className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0" />

        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-0.5 shrink-0">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 font-sans">
            {period === '日' ? '今日深度复盘' : `${period}度复盘反思`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="space-y-3 shrink-0">
          {/* 微卡片 1：今日数据自动概览 */}
          {period === '日' && (
            <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2.5">
              <span className="text-[11px] font-semibold text-zinc-400 block">
                今日数据概览 (系统自动提取)
              </span>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                  <span className="text-[10px] text-zinc-400 font-medium">事项达成</span>
                  <p className="text-base font-bold font-mono text-zinc-900 mt-0.5">
                    {completedTasksCount}/{totalTasksCount}
                  </p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                  <span className="text-[10px] text-zinc-400 font-medium">完成率</span>
                  <p className="text-base font-bold font-mono text-zinc-900 mt-0.5">{completionRate}%</p>
                </div>
                <div className="bg-white p-2 rounded-xl border border-zinc-200/60">
                  <span className="text-[10px] text-zinc-400 font-medium">习惯打卡</span>
                  <p className="text-base font-bold font-mono text-zinc-900 mt-0.5">
                    {completedHabitsCount} 个
                  </p>
                </div>
              </div>

              {completedTaskTitles.length > 0 && (
                <div className="pt-1.5 border-t border-zinc-200/50 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-zinc-400 shrink-0">已完成:</span>
                  {completedTaskTitles.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-200/60 text-zinc-700 truncate max-w-[120px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 微卡片 2：三段式结构化深度反思 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2.5 text-xs">
            {/* 1. 今日成就 */}
            <div className="space-y-1">
              <span className="text-zinc-600 font-semibold text-[11px] block">
                1. 今日成就 (突破与高光)
              </span>
              <textarea
                value={done}
                onChange={(e) => setDone(e.target.value)}
                rows={2}
                placeholder="今天完成了哪些重要事情？做成了什么？"
                className="w-full bg-white border border-zinc-200/80 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
              />
            </div>

            {/* 2. 改进之处 */}
            <div className="space-y-1">
              <span className="text-zinc-600 font-semibold text-[11px] block">
                2. 改进之处 (偏差与阻碍)
              </span>
              <textarea
                value={improve}
                onChange={(e) => setImprove(e.target.value)}
                rows={2}
                placeholder="哪里偏离了节奏？存在什么阻碍？"
                className="w-full bg-white border border-zinc-200/80 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
              />
            </div>

            {/* 3. 明日计划 */}
            <div className="space-y-1">
              <span className="text-zinc-600 font-semibold text-[11px] block">
                3. 明日计划 (睁眼头等大事)
              </span>
              <textarea
                value={tomorrow}
                onChange={(e) => setTomorrow(e.target.value)}
                rows={2}
                placeholder="明天最优先处理、必须拿下的 1~3 件事..."
                className="w-full bg-white border border-zinc-200/80 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="pt-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            保存复盘记录
          </button>
        </div>
      </div>
    </div>
  )
}
