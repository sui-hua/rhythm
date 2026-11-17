import React, { useState, useRef } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'
import { TimelineRibbon } from '../TimelineRibbon'

export interface GoalSavePayload {
  id?: number
  title: string
  category: string
  startMonth: number
  endMonth: number
  time: string
  duration: number
  carryOverEnabled: boolean
  carryOverDays: number
  forceOverwriteTiming?: boolean
}

interface GoalModalProps {
  goal?: Goal | null
  categories?: string[]
  onAddCategory?: (cat: string) => void
  onDeleteCategory?: (cat: string) => void
  onClose: () => void
  onSave: (data: GoalSavePayload) => void
  onDelete?: (id: number) => void
}

const DEFAULT_CATEGORIES = ['学习', '健康', '工作', '生活', '未分类']
const CARRY_OVER_OPTIONS = [1, 3, 5, 7]
const MONTH_LIST = Array.from({ length: 12 }, (_, i) => i + 1)

export const GoalModal: React.FC<GoalModalProps> = ({
  goal,
  categories: externalCategories,
  onAddCategory,
  onDeleteCategory,
  onClose,
  onSave,
  onDelete
}) => {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [startMonth, setStartMonth] = useState(goal?.startMonth ?? 5)
  const [endMonth, setEndMonth] = useState(goal?.endMonth ?? 8)
  const [time, setTime] = useState(goal?.time ?? '09:00')
  const [duration, setDuration] = useState(goal?.duration ?? 45)
  const [carryOverEnabled, setCarryOverEnabled] = useState(goal?.carryOverEnabled ?? true)
  const [carryOverDays, setCarryOverDays] = useState(goal?.carryOverDays ?? 3)
  const [forceOverwriteTiming, setForceOverwriteTiming] = useState(false)

  // 高级选项展开/收起
  const [showAdvanced, setShowAdvanced] = useState(false)

  // 分类状态管理 (形态 1：行内即席新增与管理)
  const [localCategories, setLocalCategories] = useState<string[]>(
    externalCategories && externalCategories.length > 0 ? externalCategories : DEFAULT_CATEGORIES
  )
  const categories = externalCategories && externalCategories.length > 0 ? externalCategories : localCategories
  const [category, setCategory] = useState(goal?.category ?? categories[0] ?? '学习')
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCatName, setNewCatName] = useState('')

  const handleCreateCategory = () => {
    const trimmed = newCatName.trim()
    if (!trimmed) return
    if (!categories.includes(trimmed)) {
      if (onAddCategory) {
        onAddCategory(trimmed)
      } else {
        setLocalCategories((prev) => [...prev, trimmed])
      }
    }
    setCategory(trimmed)
    setNewCatName('')
    setIsAddingCategory(false)
  }

  const handleDeleteCategory = (catToDelete: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(catToDelete)
    } else {
      setLocalCategories((prev) => prev.filter((c) => c !== catToDelete))
    }
    if (category === catToDelete) {
      setCategory(DEFAULT_CATEGORIES[0])
    }
  }

  // 下拉手势滑动交互
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setDragY(delta)
    }
  }

  const handleTouchEnd = () => {
    if (dragY > 120) {
      onClose()
    } else {
      setDragY(0)
    }
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY
    setIsDragging(true)

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY
      if (delta > 0) {
        setDragY(delta)
      }
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      const delta = upEvent.clientY - startY
      if (delta > 120) {
        onClose()
      } else {
        setDragY(0)
      }
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
      id: goal ? goal.id : undefined,
      title: title.trim(),
      category,
      startMonth,
      endMonth,
      time: time || '09:00',
      duration: Number(duration) || 45,
      carryOverEnabled,
      carryOverDays: Number(carryOverDays) || 3,
      forceOverwriteTiming
    })
    onClose()
  }

  const handleDelete = () => {
    if (goal && onDelete) {
      onDelete(goal.id)
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
      {/* 方案 2：规范化对齐 Task/Habit 抽屉 (全 App 统一标准标尺 TimelineRibbon + 纯净起止双胶囊) */}
      <div
        className="w-full max-w-[390px] bg-white rounded-t-[32px] p-6 pt-3 space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200 border-t border-zinc-100 flex flex-col max-h-[92vh]"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部下拉手柄 */}
        <div
          className="flex items-center justify-center py-2 shrink-0 select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div
            className="w-10 h-1 bg-zinc-200 hover:bg-zinc-300 rounded-full cursor-pointer transition-colors"
            onClick={onClose}
            title="下拉关闭"
          />
        </div>

        {/* 1. 目标标题输入 (统一 TaskModal / HabitModal 规格) */}
        <div className="shrink-0 px-0.5">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
            type="text"
            autoFocus
            placeholder="输入目标名称"
            className="w-full bg-zinc-50 border border-zinc-200/80 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-900 font-medium placeholder:text-zinc-400 transition-all"
          />
        </div>

        {/* 可滚动区域 */}
        <div className="space-y-3 overflow-y-auto no-scrollbar px-0.5 py-1">
          {/* 2. Rhythm 标志性时间标尺 (与 TaskModal、HabitModal 100% 对齐统一) */}
          <TimelineRibbon
            time={time}
            duration={duration}
            onChangeTime={setTime}
            onChangeDuration={setDuration}
          />

          {/* 3. 业务属性卡片：起止周期双胶囊 + 领域分类 (单行不换行横滑) */}
          <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-3">
            {/* 纯净起止双胶囊 (移除"目标周期"与"(4个月)"标签，两端居中对称) */}
            <div className="flex items-center justify-between gap-3">
              <select
                value={startMonth}
                onChange={(e) => {
                  const sm = Number(e.target.value)
                  setStartMonth(sm)
                  if (sm > endMonth) setEndMonth(sm)
                }}
                className="flex-1 bg-white border border-zinc-200/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs text-center"
              >
                {MONTH_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m < 10 ? '0' + m : m}月
                  </option>
                ))}
              </select>
              <span className="text-xs text-zinc-400 font-medium shrink-0">至</span>
              <select
                value={endMonth}
                onChange={(e) => {
                  const em = Number(e.target.value)
                  setEndMonth(em)
                  if (em < startMonth) setStartMonth(em)
                }}
                className="flex-1 bg-white border border-zinc-200/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 cursor-pointer shadow-2xs text-center"
              >
                {MONTH_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m < 10 ? '0' + m : m}月
                  </option>
                ))}
              </select>
            </div>

            {/* 领域分类 (单行不换行、可横向滚动，移除"领域分类"标题) */}
            <div className="pt-2.5 border-t border-zinc-200/50">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none flex-nowrap">
                {categories.map((cat) => {
                  const isSelected = category === cat
                  const isCustom = !DEFAULT_CATEGORIES.includes(cat)

                  return (
                    <div
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        'group relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1 select-none active:scale-95 shrink-0',
                        isSelected
                          ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                          : 'bg-white border-zinc-200/80 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                      )}
                    >
                      <span>{cat}</span>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(cat)
                          }}
                          className={cn(
                            'w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors text-[11px] leading-none ml-0.5 cursor-pointer',
                            isSelected
                              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                              : 'text-zinc-400 hover:text-rose-600 hover:bg-rose-50'
                          )}
                          title="删除此分类"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}

                {/* 形态 1：药丸末尾行内即席新增 (单行内随列表横滑) */}
                {isAddingCategory ? (
                  <div className="flex items-center gap-1 bg-white border border-zinc-900/40 rounded-xl px-2 py-1 shadow-2xs animate-in fade-in-50 duration-150 shrink-0">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateCategory()
                        if (e.key === 'Escape') setIsAddingCategory(false)
                      }}
                      autoFocus
                      placeholder="分类名..."
                      className="w-16 bg-transparent text-xs font-medium text-zinc-900 focus:outline-none placeholder:text-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={!newCatName.trim()}
                      className="text-[11px] font-bold text-zinc-900 hover:text-black disabled:opacity-30 cursor-pointer"
                    >
                      确定
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(true)
                      setNewCatName('')
                    }}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-zinc-300 hover:border-zinc-900 hover:bg-white text-zinc-400 hover:text-zinc-900 transition-all flex items-center gap-0.5 cursor-pointer select-none shrink-0"
                    title="添加自定义分类"
                  >
                    <Plus size={12} />
                    <span>新增</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. 高级选项折叠区 (严格按用户要求：去掉括号中的解释文字，纯粹为「高级选项」) */}
          <div className="space-y-2 pt-0.5">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-800 transition-colors select-none cursor-pointer px-1"
            >
              <ChevronRight
                size={13}
                className={cn('transition-transform duration-200', showAdvanced && 'rotate-90')}
              />
              <span>高级选项</span>
            </button>

            {showAdvanced && (
              <div className="p-3.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl space-y-3 animate-in fade-in-50 duration-150">
                {/* 未完成顺延 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-700 block">未完成顺延</span>
                    <span className="text-[10px] text-zinc-400">当日未完成则次日时序日程自动延后提醒</span>
                  </div>
                  <div className="flex bg-zinc-200/60 p-0.5 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setCarryOverEnabled(false)}
                      className={cn(
                        'px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer',
                        !carryOverEnabled ? 'bg-white text-zinc-900 font-bold shadow-xs' : 'text-zinc-500'
                      )}
                    >
                      关
                    </button>
                    <button
                      type="button"
                      onClick={() => setCarryOverEnabled(true)}
                      className={cn(
                        'px-2.5 py-0.5 rounded-lg text-xs transition-all cursor-pointer',
                        carryOverEnabled ? 'bg-zinc-900 text-white font-bold shadow-xs' : 'text-zinc-500'
                      )}
                    >
                      开
                    </button>
                  </div>
                </div>

                {carryOverEnabled && (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/50">
                    <span className="text-xs text-zinc-500 font-medium">顺延周期</span>
                    <div className="flex items-center gap-1.5">
                      {CARRY_OVER_OPTIONS.map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setCarryOverDays(days)}
                          className={cn(
                            'px-2.5 py-1 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer',
                            carryOverDays === days
                              ? 'bg-zinc-900 text-white font-bold shadow-xs'
                              : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                          )}
                        >
                          {days}天
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {goal && (
                  <label className="flex items-center gap-2 pt-1 border-t border-zinc-200/50 cursor-pointer select-none text-xs text-zinc-500">
                    <input
                      type="checkbox"
                      checked={forceOverwriteTiming}
                      onChange={(e) => setForceOverwriteTiming(e.target.checked)}
                      className="rounded border-zinc-300 text-zinc-900 focus:ring-0"
                    />
                    <span>同步更新月度战役的执行时间</span>
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 5. 底部操作区 (统一 TaskModal / HabitModal 规格) */}
        <div className="space-y-2 pt-1 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
          >
            {goal ? '保存修改' : '确认创建'}
          </button>

          {goal && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                删除此目标
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
