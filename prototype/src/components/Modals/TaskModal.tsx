import React, { useState, useRef } from 'react'
import { X } from 'lucide-react'
import type { Task } from '../../types'
import { TimelineRibbon, getNearestCurrentTime } from '../TimelineRibbon'

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

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(task?.title ?? '')
  const [time, setTime] = useState(task?.time ?? getNearestCurrentTime())
  const [duration, setDuration] = useState(task?.duration ?? 30)

  // 下拉关闭手势状态
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - touchStartY.current
    if (deltaY > 0) {
      setDragY(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (dragY > 60) {
      onClose()
    }
    setDragY(0)
    setIsDragging(false)
  }

  // 支持桌面端鼠标拖拽手柄下拉关闭
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartY.current = e.clientY
    setIsDragging(true)

    const onMouseMove = (ev: MouseEvent) => {
      const deltaY = ev.clientY - touchStartY.current
      if (deltaY > 0) {
        setDragY(deltaY)
      }
    }

    const onMouseUp = () => {
      setDragY((curr) => {
        if (curr > 60) {
          onClose()
        }
        return 0
      })
      setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const canSubmit = title.trim().length > 0

  const handleSave = () => {
    if (!canSubmit) return
    onSave({
      id: task ? task.id : null,
      title: title.trim(),
      time: time || '09:00',
      duration: Number(duration) || 30,
      description: task?.description,
      category: task?.category ?? '未分类'
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
      <div
        className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 pt-3 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部轻量手柄与关闭区（去除冗余大标题，支持下拉关闭与右上角点击关闭） */}
        <div
          className="relative flex items-center justify-center py-2 shrink-0 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          {/* 下拉手柄条 */}
          <div
            className="w-10 h-1 bg-zinc-200 hover:bg-zinc-300 rounded-full cursor-pointer transition-colors"
            onClick={onClose}
            title="下拉或点击关闭"
          />

          {/* 右上角关闭按钮 */}
          <button
            type="button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="关闭"
            className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="space-y-3 shrink-0">
          {/* 任务标题输入 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            autoFocus
            placeholder="任务标题"
            className="w-full bg-zinc-50 border border-zinc-200/70 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400"
          />

          {/* 横向时序刻度滑尺与时长选择 */}
          <TimelineRibbon
            time={time}
            duration={duration}
            onChangeTime={setTime}
            onChangeDuration={setDuration}
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
