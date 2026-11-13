import React, { useState } from 'react'
import { CalendarRange, Clock, Tag, RotateCw, Trash2 } from 'lucide-react'
import type { Goal } from '../../types'
import { cn } from '../../lib/utils'

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
  onClose: () => void
  onSave: (data: GoalSavePayload) => void
  onDelete?: (id: number) => void
}

const CATEGORIES = ['学习', '健康', '工作', '生活', '未分类']
const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1 < 10 ? '0' + (i + 1) : i + 1}月`
}))
const CARRY_OVER_OPTIONS = [1, 3, 5, 7]

// iOS 原生开关组件
const IOSSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({
  checked,
  onChange
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      'w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200 cursor-pointer flex items-center focus:outline-none shrink-0',
      checked ? 'bg-zinc-900' : 'bg-zinc-200'
    )}
  >
    <div
      className={cn(
        'w-[27px] h-[27px] bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2),0_1px_1px_rgba(0,0,0,0.1)] transition-transform duration-200 ease-out',
        checked ? 'translate-x-[20px]' : 'translate-x-0'
      )}
    />
  </button>
)

export const GoalModal: React.FC<GoalModalProps> = ({ goal, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [category, setCategory] = useState(goal?.category ?? '学习')
  const [startMonth, setStartMonth] = useState(goal?.startMonth ?? 5)
  const [endMonth, setEndMonth] = useState(goal?.endMonth ?? 8)
  const [time, setTime] = useState(goal?.time ?? '09:00')
  const [duration, setDuration] = useState(goal?.duration ?? 45)
  const [carryOverEnabled, setCarryOverEnabled] = useState(goal?.carryOverEnabled ?? true)
  const [carryOverDays, setCarryOverDays] = useState(goal?.carryOverDays ?? 3)
  const [forceOverwriteTiming, setForceOverwriteTiming] = useState(false)

  const handleStartMonthChange = (val: number) => {
    setStartMonth(val)
    if (endMonth < val) {
      setEndMonth(val)
    }
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
            {goal ? '编辑目标' : '新建目标'}
          </h2>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSubmit}
            className="text-[16px] font-semibold text-zinc-900 disabled:text-zinc-300 active:opacity-60 transition-opacity cursor-pointer disabled:cursor-not-allowed"
          >
            {goal ? '完成' : '添加'}
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
              placeholder="长期目标名称 (如：掌握 Rust 异步系统编程)"
              className="w-full bg-transparent text-[17px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>

          {/* Group 2：执行时轴与分类 Inset Grouped 岛屿 */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] divide-y divide-zinc-100 overflow-hidden text-[15px]">
            {/* 执行起止月份 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <CalendarRange size={16} />
                </div>
                <span className="font-normal text-zinc-900">执行时轴</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <select
                  value={startMonth}
                  onChange={(e) => handleStartMonthChange(Number(e.target.value))}
                  className="bg-zinc-100/80 px-2 py-1 rounded-lg font-bold text-zinc-800 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <span className="text-zinc-400 font-sans">至</span>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(Number(e.target.value))}
                  className="bg-zinc-100/80 px-2 py-1 rounded-lg font-bold text-zinc-800 focus:outline-none cursor-pointer"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value} disabled={m.value < startMonth}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 目标分类 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Tag size={16} />
                </div>
                <span className="font-normal text-zinc-900">目标分类</span>
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

            {/* 默认排期与时长 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <span className="font-normal text-zinc-900">默认时间</span>
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-zinc-100/80 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>

            {/* 预计时长 */}
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <span className="text-zinc-500 text-xs ml-9">单次时长</span>
              <div className="flex items-center gap-1.5">
                {[30, 45, 60, 90].map((dur) => (
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
          </div>

          {/* Group 3：未完成延后展示 Carry-Over（iOS Switch 触感开关） */}
          <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] divide-y divide-zinc-100 overflow-hidden text-[15px]">
            <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <RotateCw size={16} />
                </div>
                <div>
                  <span className="font-normal text-zinc-900 block leading-tight">未完成延后展示</span>
                  <span className="text-[11px] text-zinc-400 font-normal">过期自动在时序中向后顺延</span>
                </div>
              </div>
              <IOSSwitch checked={carryOverEnabled} onChange={setCarryOverEnabled} />
            </div>

            {carryOverEnabled && (
              <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/50 animate-in fade-in-50 duration-150">
                <span className="text-xs text-zinc-500 font-medium">顺延展示天数</span>
                <div className="flex items-center gap-1.5">
                  {CARRY_OVER_OPTIONS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setCarryOverDays(days)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer',
                        carryOverDays === days
                          ? 'bg-zinc-900 text-white font-bold'
                          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      )}
                    >
                      {days}天
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Group 4（编辑模式）：同步子级战役安排 */}
          {goal && (
            <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] divide-y divide-zinc-100 overflow-hidden text-[15px]">
              <div className="flex items-center justify-between px-4 py-3 min-h-[48px]">
                <div>
                  <span className="font-normal text-zinc-900 block leading-tight">同步子级时间</span>
                  <span className="text-[11px] text-zinc-400 font-normal">覆盖各月度战役的默认时间</span>
                </div>
                <IOSSwitch checked={forceOverwriteTiming} onChange={setForceOverwriteTiming} />
              </div>
            </div>
          )}

          {/* Group 5（编辑模式专属）：独立删除行 */}
          {goal && (
            <div className="pt-2">
              <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] border border-black/[0.04] overflow-hidden">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center gap-2 p-3.5 text-[15px] font-medium text-rose-600 hover:bg-rose-50/50 active:bg-rose-100/50 transition-colors cursor-pointer"
                >
                  <Trash2 size={16} />
                  删除目标
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
