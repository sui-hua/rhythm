import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Task } from '../../types'

interface TaskModalProps {
  task: Task | null
  onClose: () => void
  onSave: (data: { id: number | null; title: string; time: string; duration: number }) => void
  onDelete?: (taskId: number) => void
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(task?.title ?? '')
  const [time, setTime] = useState(task?.time ?? '09:00')
  const [duration, setDuration] = useState(task?.duration ?? 30)

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      id: task ? task.id : null,
      title: title.trim(),
      time,
      duration: Number(duration) || 30
    })
    onClose()
  }

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id)
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
          <h2 className="text-base font-bold tracking-tight text-zinc-900">{task ? '编辑事项' : '新建事项'}</h2>
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
            placeholder="写下你想做的事..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />

          <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
            <span>开始时间:</span>
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              type="time"
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono"
            />
            <span className="ml-2">时长:</span>
            <input
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              type="number"
              step={5}
              className="w-16 bg-zinc-50 border border-zinc-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 font-mono"
            />
            <span>分钟</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          {task && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            >
              删除
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-zinc-900 text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
          >
            保存事项
          </button>
        </div>
      </div>
    </div>
  )
}
