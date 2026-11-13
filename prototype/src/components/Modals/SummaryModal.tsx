import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { PeriodType } from '../../types'

interface SummaryModalProps {
  period: PeriodType
  onClose: () => void
  onSave: (data: { text: string; period: PeriodType }) => void
}

export const SummaryModal: React.FC<SummaryModalProps> = ({ period, onClose, onSave }) => {
  const [text, setText] = useState('')

  const handleSave = () => {
    if (!text.trim()) return
    onSave({ text: text.trim(), period })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100">
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto"></div>
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-base font-bold tracking-tight text-zinc-900">记录{period}度复盘反思</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-1">
            <X size={16} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="今天有什么心得、感悟或者收获？"
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 leading-relaxed font-normal"
        />

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-2.5 bg-zinc-900 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
        >
          保存复盘记录
        </button>
      </div>
    </div>
  )
}
