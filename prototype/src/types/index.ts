export type TabKey = 'day' | 'habits' | 'direction' | 'summary'

export interface NavItem {
  key: TabKey
  name: string
  icon: string
}

export interface Task {
  id: number
  title: string
  time: string
  duration: number
  completed: boolean
  isNow?: boolean
  description?: string
  category?: string
}

export interface HabitLog {
  id: number
  date: string // '2026-05-11'
  time: string // '07:15'
  note?: string
}

export type FrequencyType = 'daily' | 'weekly' | 'monthly'

export interface Habit {
  id: number
  title: string
  streak: number
  frequency: string
  frequencyType?: FrequencyType
  weekdays?: number[]
  monthDays?: number[]
  time?: string
  duration?: number
  isArchived?: boolean
  completedToday: boolean
  completedDays: string[] // 'YYYY-MM-DD' list of completed dates
  totalYear: number // 年度总打卡天数
  completionRate: number // 周期完成率 (%)
  logs: HabitLog[]
}

export interface Goal {
  id: number
  title: string
  category: string
  milestone: string
  progress: number
  startMonth?: number
  endMonth?: number
  time?: string
  duration?: number
  carryOverEnabled?: boolean
  carryOverDays?: number
}

export type PeriodType = '日' | '周' | '月' | '年'

export interface Summary {
  id: number
  period: PeriodType
  date: string
  text: string
  done?: string
  improve?: string
  tomorrow?: string
  taskCompletionRate?: number
  completedHabitCount?: number
}
