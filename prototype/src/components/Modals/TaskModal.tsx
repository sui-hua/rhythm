import React, { useState } from 'react'
import { X, Clock, Timer, Tag, AlignLeft } from 'lucide-react'
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

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(task?.title ?? '')
  const [time, setTime] = useState(task?.time ?? '09:00')
  const [duration, setDuration] = useState(task?.duration ?? 30)
  const [description, setDescription] = useState(task?.description ?? '')
  const [category, setCategory] = useState(task?.category ?? '工作')

  const handleSave = () => {
    if (!title.trim()) return
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
      <div className="w-full max-w-[390px] max-h-[88vh] bg-white rounded-t-[32px] p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col overflow-y-auto no-scrollbar">
        {/* 顶部手柄 */}
        <div className="w-9 h-1 bg-zinc-200 rounded-full mx-auto shrink-0"></div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-[17px] font-bold tracking-tight text-zinc-900">
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
        <div className="space-y-3.5 text-xs">
          {/* 事项名称 */}
          <div className="space-y-1.5">
            <label className="text-zinc-700 font-semibold text-xs">事项名称</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              type="text"
              placeholder="例如：周会 / 准备架构方案"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400"
            />
          </div>

          {/* 时间与时长 */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
                <Clock size={12} className="text-zinc-400" />
                开始时间
              </label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                type="time"
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
                <Timer size={12} className="text-zinc-400" />
                预计时长
              </label>
              <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2">
                <input
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value) || 0)}
                  type="number"
                  min="5"
                  step="5"
                  className="w-full bg-transparent text-xs font-mono font-medium focus:outline-none"
                />
                <span className="text-[11px] text-zinc-400 font-medium shrink-0">分钟</span>
              </div>
            </div>
          </div>

          {/* 分类标签选择 */}
          <div className="space-y-1.5 pt-0.5">
            <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
              <Tag size={12} className="text-zinc-400" />
              事项分类
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                    category === cat
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 详细描述（可选详情） */}
          <div className="space-y-1.5 pt-0.5">
            <label className="text-zinc-700 font-semibold text-xs flex items-center gap-1">
              <AlignLeft size={12} className="text-zinc-400" />
              详细描述 (可选)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="补充注意事项或备忘细节..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 resize-none font-normal placeholder:text-zinc-400 leading-relaxed"
            />
          </div>
        </div>

        {/* 底部操作区 */}
        <div className="flex items-center gap-2.5 pt-2 shrink-0">
          {task && (
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
            disabled={!title.trim()}
            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            保存事项
          </button>
        </div>
      </div>
    </div>
  )
}
