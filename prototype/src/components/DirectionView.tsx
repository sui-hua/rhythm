import React from 'react'
import type { Goal } from '../types'
import { GoalListLayer, GoalMonthsLayer, GoalDaysLayer } from './Direction'

interface DirectionViewProps {
  goals: Goal[]
  activeGoalId: number | null
  activeMonthId: number | string | null
  onSelectGoal: (goalId: number) => void
  onSelectMonth: (monthId: number | string) => void
  onToggleGoalDay: (goalId: number, monthId: number | string, dayId: number | string) => void
  onAddGoalDay: (
    goalId: number,
    monthId: number | string,
    newDay: { day: number; date: string; title: string; completed: boolean; time?: string; duration?: number }
  ) => void
}

/**
 * DirectionView: Things 3 风格目标三层推入内容分发器
 * - 第一层: GoalListLayer (战略目标总览)
 * - 第二层: GoalMonthsLayer (月度战役分解)
 * - 第三层: GoalDaysLayer (每日天目标行动清单)
 * 注：吸顶面包屑与大标题统一由 AppHeader 接管，此处内容纯粹展示各层级核心清单
 */
export const DirectionView: React.FC<DirectionViewProps> = ({
  goals,
  activeGoalId,
  activeMonthId,
  onSelectGoal,
  onSelectMonth,
  onToggleGoalDay,
  onAddGoalDay
}) => {
  const activeGoal = goals.find((g) => g.id === activeGoalId) || null
  const activeMonth = activeGoal?.months?.find((m) => m.id === activeMonthId) || null

  // 【第三层：每日天目标行动清单】
  if (activeGoal && activeMonth) {
    return (
      <GoalDaysLayer
        goal={activeGoal}
        month={activeMonth}
        onToggleDay={(dayId) => onToggleGoalDay(activeGoal.id, activeMonth.id, dayId)}
        onAddDay={(newDay) => onAddGoalDay(activeGoal.id, activeMonth.id, newDay)}
      />
    )
  }

  // 【第二层：月度战役分解】
  if (activeGoal) {
    return (
      <GoalMonthsLayer
        goal={activeGoal}
        onSelectMonth={onSelectMonth}
      />
    )
  }

  // 【第一层：战略总览】
  return (
    <GoalListLayer
      goals={goals}
      onSelectGoal={onSelectGoal}
    />
  )
}
