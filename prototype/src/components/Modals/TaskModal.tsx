import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Task } from '../../types'
import { cn } from '../../lib/utils'

export interface TaskSavePayload {
  id: number | null
  title: string
  time: string
  duration: number
  description?: string
  category?: string
}

interface TaskModalProps {
  task: Task | null
  onClose: () => void
  onSave: (data: TaskSavePayload) => void
  onDelete?: (taskId: number) => void
}

const CATEGORIES = ['工作', '学习', '健康', '生活', '未分类']
const QUICK_DURATIONS = [15, 30, 45, 60]

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(task?.title ?? '')
  const [time, setTime] = useState(task?.time ?? '09:00')
  const [duration, setDuration] = useState(task?.duration ?? 30)
  const [description, setDescription] = useState(task?.description ?? '')
  const [category, setCategory] = useState(task?.category ?? '工作')

  const canSubmit = title.trim().length > 0

  const handleSave = () => {
    if (!canSubmit) return
    onSave({
      id: task ? task.id : null,
      title: title.trim(),
      time: time || '09:00',
      duration: Number(duration) || 30,
      description: description.trim() || undefined,
      category
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
      <div className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0" />

        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between pb-0.5 shrink-0">
          <h2 className="text-base font-bold tracking-tight text-zinc-900 font-sans">
            {task ? '编辑日程事项' : '新建日程事项'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-900 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="space-y-3 shrink-0">
          {/* 事项标题输入 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            placeholder="写下你想做的事 (例如: 准备架构评审材料)"
            className="w-full bg-zinc-50 border border-zinc-200/70 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400"
          />

          {/* 微卡片 1：时间与时长 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 block">开始时间与时长</span>
            <div className="flex items-center justify-between gap-3">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-900 focus:outline-none cursor-pointer shadow-2xs"
              />

              {/* 快捷时长胶囊 */}
              <div className="flex items-center gap-1.5">
                {QUICK_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer',
                      duration === dur
                        ? 'bg-zinc-900 text-white font-bold shadow-xs'
                        : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                    )}
                  >
                    {dur}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 微卡片 2：分类标签选择 */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-2">
            <span className="text-[11px] font-semibold text-zinc-400 block">事项分类</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                    category === cat
                      ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                      : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-100'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 备忘录 (可选) */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="添加备忘或细节描述 (可选)..."
            className="w-full bg-zinc-50 border border-zinc-200/70 rounded-2xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
          />
        </div>

        {/* 底部操作区 */}
        <div className="space-y-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {task ? '保存修改' : '确认添加'}
          </button>

          {task && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                删除此事项
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
