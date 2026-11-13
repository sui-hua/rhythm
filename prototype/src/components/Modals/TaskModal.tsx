import React, { useState } from 'react'
import { Clock, Timer, Tag, AlignLeft, Trash2 } from 'lucide-react'
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
const QUICK_DURATIONS = [15, 30, 45, 60, 90]

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
      <div className="w-full max-w-[390px] max-h-[90vh] bg-[#f2f2f7] rounded-t-[32px] shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-200 flex flex-col overflow-hidden">
        {/* iOS 经典手柄 */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-9 h-1 bg-zinc-300 rounded-full" />
        </div>

        {/* iOS 原生导航栏：取消 · 标题 · 完成/添加 */}
        <div className="px-4 py-2 flex items-center justify-between shrink-0 border-b border-zinc-200/60 bg-[#f2f2f7]">
          <button
            type="button"
            onClick={onClose}
            className="text-[16px] text-zinc-500 hover:text-zinc-800 active:opacity-60 transition-opacity cursor-pointer font-normal"
          >
            取消
          </button>
          <h2 className="text-[16.5px] font-semibold tracking-tight text-zinc-900 font-sans">
            {task ? '编辑事项' : '新建事项'}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="text-[16px] font-semibold text-zinc-900 disabled:text-zinc-300 active:opacity-60 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {task ? '完成' : '添加'}
          </button>
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          {/* Group 1：顶格无边框大字标题岛屿 */}
          <div className="bg-white rounded-2xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              placeholder="想做点什么..."
              className="w-full bg-transparent text-[17px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {/* Group 2：时间、时长与分类 Inset Grouped 岛屿 */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] divide-y divide-zinc-100 overflow-hidden text-[15px]">
            {/* 时间行 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <span className="font-normal text-zinc-900">开始时间</span>
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-zinc-100/80 px-2.5 py-1 rounded-lg text-sm font-mono font-medium text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* 时长行 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Timer size={16} />
                </div>
                <span className="font-normal text-zinc-900">预计时长</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {QUICK_DURATIONS.map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setDuration(dur)}
                    className={cn(
                      'px-2 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer',
                      duration === dur
                        ? 'bg-zinc-900 text-white font-bold'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70'
                    )}
                  >
                    {dur}分
                  </button>
                ))}
              </div>
            </div>

            {/* 分类行 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Tag size={16} />
                </div>
                <span className="font-normal text-zinc-900">分类标签</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
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
          </div>

          {/* Group 3：详细描述备忘录岛屿 */}
          <div className="bg-white rounded-2xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <AlignLeft size={13} />
              <span>备忘录 (可选)</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="添加细节、地点或核心要点..."
              className="w-full bg-transparent text-[15px] font-normal text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Group 4（编辑模式专属）：独立删除行 */}
          {task && (
            <div className="pt-2">
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] overflow-hidden">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 p-3.5 text-[15px] font-medium text-rose-600 hover:bg-rose-50/50 active:bg-rose-100/50 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  删除事项
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
