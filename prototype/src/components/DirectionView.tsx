import React, { useState } from 'react'
import type { Goal } from '../types'
import { GoalListLayer, GoalMonthsLayer, GoalDaysLayer } from './Direction'

interface DirectionViewProps {
  goals: Goal[]
  onEditGoal: (goal: Goal) => void
  onToggleGoalDay: (goalId: number, monthId: number | string, dayId: number | string) => void
  onAddGoalDay: (
    goalId: number,
    monthId: number | string,
    newDay: { day: number; date: string; title: string; completed: boolean; time?: string; duration?: number }
  ) => void
  onUpdateMonthTitle: (goalId: number, monthId: number | string, newTitle: string) => void
}

/**
 * DirectionView: Things 3 风格目标三层推入控制器
 * - 第一层: GoalListLayer (战略目标总览)
 * - 第二层: GoalMonthsLayer (月度战役分解)
 * - 第三层: GoalDaysLayer (每日天目标行动清单)
 */
export const DirectionView: React.FC<DirectionViewProps> = ({
  goals,
  onEditGoal,
  onToggleGoalDay,
  onAddGoalDay,
  onUpdateMonthTitle
}) => {
  // 导航路由状态
  const [activeGoalId, setActiveGoalId] = useState<number | null>(null)
  const [activeMonthId, setActiveMonthId] = useState<number | string | null>(null)

  const activeGoal = goals.find((g) => g.id === activeGoalId) || null
  const activeMonth = activeGoal?.months?.find((m) => m.id === activeMonthId) || null

  // 【第三层：每日天目标行动清单】
  if (activeGoal && activeMonth) {
    return (
      <GoalDaysLayer
        goal={activeGoal}
        month={activeMonth}
        onBack={() => setActiveMonthId(null)}
        onToggleDay={(dayId) => onToggleGoalDay(activeGoal.id, activeMonth.id, dayId)}
        onAddDay={(newDay) => onAddGoalDay(activeGoal.id, activeMonth.id, newDay)}
        onUpdateMonthTitle={(newTitle) => onUpdateMonthTitle(activeGoal.id, activeMonth.id, newTitle)}
      />
    )
  }

  // 【第二层：月度战役分解】
  if (activeGoal) {
    return (
      <GoalMonthsLayer
        goal={activeGoal}
        onBack={() => setActiveGoalId(null)}
        onEditGoal={onEditGoal}
        onSelectMonth={(monthId) => setActiveMonthId(monthId)}
      />
    )
  }

  // 【第一层：战略总览】
  return (
    <GoalListLayer
      goals={goals}
      onSelectGoal={(goalId) => setActiveGoalId(goalId)}
    />
  )
}
