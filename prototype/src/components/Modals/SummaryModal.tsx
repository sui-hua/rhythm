import React, { useState } from 'react'
import { X, CheckCircle2, Flame, Sparkles } from 'lucide-react'
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

  const handleSave = () => {
    const combinedText = [
      done.trim() ? `【今日成就】${done.trim()}` : '',
      improve.trim() ? `【改进反思】${improve.trim()}` : '',
      tomorrow.trim() ? `【明日焦点】${tomorrow.trim()}` : ''
    ]
      .filter(Boolean)
      .join('\n')

    if (!combinedText) return

    onSave({
      period,
      text: combinedText,
      done: done.trim(),
      improve: improve.trim(),
      tomorrow: tomorrow.trim()
    })
    onClose()
  }

  const canSubmit = done.trim() || improve.trim() || tomorrow.trim()

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[390px] max-h-[88vh] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col overflow-y-auto no-scrollbar">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0"></div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-bold tracking-tight text-zinc-900">
              {period === '日' ? '完成今日深度复盘' : `记录${period}度复盘`}
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">回顾成果，反思阻碍，明确下一阶段焦点</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 今日数据概览卡片（自动聚合系统真实数据，对齐 Web 端） */}
        {period === '日' && (
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/70 rounded-2xl space-y-2.5 shrink-0">
            <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1">
              <Sparkles size={12} className="text-zinc-500" />
              今日数据概览 (系统自动提取)
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-zinc-200/50">
                <span className="text-[10px] text-zinc-400 font-medium">任务完成</span>
                <p className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                  {completedTasksCount}/{totalTasksCount}
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-zinc-200/50">
                <span className="text-[10px] text-zinc-400 font-medium">完成率</span>
                <p className="text-sm font-bold font-mono text-zinc-900 mt-0.5">{completionRate}%</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-zinc-200/50">
                <span className="text-[10px] text-zinc-400 font-medium">习惯打卡</span>
                <p className="text-sm font-bold font-mono text-zinc-900 mt-0.5">
                  {completedHabitsCount} 个
                </p>
              </div>
            </div>

            {completedTaskTitles.length > 0 && (
              <div className="pt-1 border-t border-zinc-200/50 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-zinc-400 shrink-0">已达成:</span>
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

        {/* 三段式结构化深度反思表单（对齐 Web 端 DailySummaryForm） */}
        <div className="space-y-3.5 text-xs">
          {/* 1. 今日成就 */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-500" />
              1. 今日成就 (突破与高光)
            </label>
            <textarea
              value={done}
              onChange={(e) => setDone(e.target.value)}
              rows={2}
              placeholder="今天完成了哪些重要事情？做成了什么？"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
            />
          </div>

          {/* 2. 改进之处 */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
              <span className="text-amber-500 font-bold">💡</span>
              2. 改进之处 (偏差与阻碍)
            </label>
            <textarea
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
              rows={2}
              placeholder="哪里偏离了节奏？有哪些地方可以做得更好？"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
            />
          </div>

          {/* 3. 明日计划 */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
              <Flame size={12} className="text-rose-500" />
              3. 明日计划 (睁眼头等大事)
            </label>
            <textarea
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              rows={2}
              placeholder="明天最优先处理、必须拿下的 1~3 件事是什么？"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
            />
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="pt-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            保存今日复盘
          </button>
        </div>
      </div>
    </div>
  )
}
