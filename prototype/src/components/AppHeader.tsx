import React from 'react'
import { ChevronDown, ArrowLeft } from 'lucide-react'
import type { TabKey, PeriodType, Goal, GoalMonth } from '../types'

interface AppHeaderProps {
  time?: string
  currentTab: TabKey

  // Day Tab 属性
  selectedDateLine?: string
  isToday?: boolean
  onOpenDatePicker?: () => void
  onBackToToday?: () => void
  taskProgressRing?: React.ReactNode

  // Habits Tab 属性
  habitProgressRing?: React.ReactNode

  // Direction Tab 属性 (Things 3 三层推入导航)
  activeGoal?: Goal | null
  activeMonth?: GoalMonth | null
  onBackFromGoal?: () => void
  onBackFromMonth?: () => void
  onEditGoal?: () => void
  onUpdateMonthTitle?: (newTitle: string) => void
  goalProgressRing?: React.ReactNode

  // Summary Tab 属性
  activePeriod?: PeriodType
  onSelectPeriod?: (period: PeriodType) => void

  // 兼容自定义插槽 (可选扩展)
  title?: string
  titleSlot?: React.ReactNode
  rightSlot?: React.ReactNode
}

/**
 * AppHeader: 吸顶导航栏统一独立组件 (Fixed Height: 92px)
 * - 灵动岛状态栏: 固定 40px
 * - 核心导航微控行: 固定 52px
 * 彻底消除切换 Tab 或下钻层级时的任何高度抖动，严格保持原生对齐基准
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  time = '09:41',
  currentTab,
  selectedDateLine = '',
  isToday = true,
  onOpenDatePicker,
  onBackToToday,
  taskProgressRing,
  habitProgressRing: _habitProgressRing,
  activeGoal,
  activeMonth,
  onBackFromGoal,
  onBackFromMonth,
  onEditGoal,
  onUpdateMonthTitle,
  goalProgressRing,
  title,
  titleSlot,
  rightSlot
}) => {
  // ── 渲染左侧标题 / 返回区 ──
  const renderNavLeft = () => {
    // 允许自定义插槽覆盖
    if (titleSlot) return titleSlot

    switch (currentTab) {
      case 'day':
        return (
          <button
            type="button"
            onClick={onOpenDatePicker}
            className="group flex items-center gap-1.5 text-left text-zinc-900 active:scale-[0.98] transition-all select-none cursor-pointer"
            title="点击选择日期"
          >
            <h1 className="text-[20px] font-bold tracking-tight font-sans group-hover:text-zinc-600 transition-colors">
              {selectedDateLine}
            </h1>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-zinc-400 group-hover:text-zinc-800 group-hover:bg-zinc-100 transition-all">
              <ChevronDown size={13} strokeWidth={2.5} />
            </div>
            {!isToday && onBackToToday && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  onBackToToday()
                }}
                className="text-[10px] font-mono font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded-full transition-colors active:scale-95 ml-0.5 cursor-pointer"
                title="点击直接返回今天"
              >
                今
              </span>
            )}
          </button>
        )

      case 'habits':
        return (
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 leading-none">
            日常习惯
          </h1>
        )

      case 'direction':
        // 第三层：天目标行动清单 (方案 A 纯粹标头)
        if (activeGoal && activeMonth) {
          const monthText = activeMonth.month < 10 ? '0' + activeMonth.month : activeMonth.month
          return (
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onBackFromMonth}
                className="p-1 -ml-1 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
                title="返回月度战役"
              >
                <ArrowLeft size={16} />
              </button>
              <h1
                onClick={() => {
                  if (onUpdateMonthTitle && activeGoal && activeMonth) {
                    const next = window.prompt('修改本月核心战役标题：', activeMonth.title || '')
                    if (next && next.trim()) {
                      onUpdateMonthTitle(next.trim())
                    }
                  }
                }}
                className="text-[15px] font-bold tracking-tight text-zinc-900 truncate cursor-pointer hover:text-zinc-600 transition-colors"
                title="点击修改月度战役名称"
              >
                <span className="text-zinc-400 font-mono font-semibold mr-1.5">
                  {monthText}月 ·
                </span>
                {activeMonth.title || '核心战役'}
              </h1>
            </div>
          )
        }

        // 第二层：月度战役分解 (Things 3 纯粹标头)
        if (activeGoal) {
          return (
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={onBackFromGoal}
                className="p-1 -ml-1 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer shrink-0"
                title="返回全部目标"
              >
                <ArrowLeft size={16} />
              </button>
              <h1
                onClick={() => onEditGoal?.()}
                className="text-[16px] font-bold tracking-tight text-zinc-900 truncate cursor-pointer hover:text-zinc-600 transition-colors"
                title="点击编辑总目标设置"
              >
                {activeGoal.title}
              </h1>
            </div>
          )
        }

        // 第一层：长期目标总览
        return (
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 leading-none">
            长期目标
          </h1>
        )

      case 'summary':
        return (
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 leading-none">
            复盘总结
          </h1>
        )

      default:
        return title ? (
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 leading-none">
            {title}
          </h1>
        ) : null
    }
  }

  // ── 渲染右侧微控区 ──
  const renderNavRight = () => {
    // 允许自定义插槽覆盖
    if (rightSlot) return rightSlot

    switch (currentTab) {
      case 'day':
        return taskProgressRing

      case 'habits':
        // 习惯为长期资产概览中心（打卡于 Day 完成），顶栏右上角保持留白纯净
        return null

      case 'direction':
        // 第三层：天目标行动页 (右上角留白，给标题最大呼吸空间)
        if (activeGoal && activeMonth) {
          return null
        }

        // 第二层：月度战役分解 (右上角留白，总目标长按/点击打开设置抽屉)
        if (activeGoal) {
          return null
        }

        // 第一层：全局推进度
        return goalProgressRing

      case 'summary':
        // 方案 A：右上角完全留白，切换移至内容区顶部
        return null

      default:
        return null
    }
  }

  return (
    <header className="sticky top-0 z-50 h-[92px] shrink-0 bg-white/85 backdrop-blur-xl border-b border-zinc-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-none select-none">
      {/* 1. 灵动岛与原生状态栏 (严格固定高度 40px) */}
      <div className="h-10 px-7 flex items-center justify-between text-xs font-semibold tracking-tight">
        <span className="font-mono text-[13px] text-zinc-800">{time}</span>
        <div className="w-22 h-4.5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 text-zinc-700">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.6 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
          </svg>
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      {/* 2. 核心导航插槽行 (严格固定高度 52px) */}
      <div className="h-[52px] px-6 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 h-full">
          {renderNavLeft()}
        </div>
        <div className="shrink-0 flex items-center justify-end h-full">
          {renderNavRight()}
        </div>
      </div>
    </header>
  )
}
