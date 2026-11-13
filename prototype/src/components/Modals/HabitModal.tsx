import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Habit } from '../../types'

interface HabitModalProps {
  habit?: Habit | null
  onClose: () => void
  onSave: (data: { id?: number; title: string; frequency: string }) => void
  onDelete?: (id: number) => void
}

export const HabitModal: React.FC<HabitModalProps> = ({ habit, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(habit?.title ?? '')
  const [frequency, setFrequency] = useState(habit?.frequency ?? '每日')

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      id: habit ? habit.id : undefined,
      title: title.trim(),
      frequency
    })
    onClose()
  }

  const handleDelete = () => {
    if (habit && onDelete) {
      onDelete(habit.id)
    }
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
          <h2 className="text-base font-bold tracking-tight text-zinc-900">
            {habit ? '编辑习惯' : '添加日常习惯'}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-900 p-1">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            placeholder="例如：早起晨读 30 分钟"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <span>重复频率:</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 font-sans"
            >
              <option value="每日">每日</option>
              <option value="工作日">工作日</option>
              <option value="每周3次">每周3次</option>
              <option value="每周5次">每周5次</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          {habit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              删除
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {habit ? '保存修改' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  )
}
