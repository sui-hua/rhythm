import { create } from 'zustand'
import {
  buildSeedDayData,
  buildSeedHabitLogs,
  buildSeedSummaries,
  CATEGORIES,
  SEED_GOALS,
  SEED_HABITS,
  toDateKey,
  type MockGoal,
  type MockHabit,
  type MockPlan,
  type MockSummary,
  type MockTask
} from './data'

// 假数据全局状态：页面交互（打卡/勾选/保存）都落在内存 store，不触达 Supabase
type MockState = {
  habits: MockHabit[]
  habitLogs: Record<string, true>
  goals: MockGoal[]
  goalDayOverrides: Record<string, boolean>
  tasks: MockTask[]
  plans: MockPlan[]
  taskOverrides: Record<string, boolean>
  planOverrides: Record<string, boolean>
  summaries: MockSummary[]
  reminderEnabled: boolean

  toggleHabitCheckin: (habitId: string, dateKey: string) => void
  toggleGoalDay: (dayId: string) => void
  toggleTask: (dateKey: string, taskId: string) => void
  togglePlan: (dateKey: string, planId: string) => void
  saveTask: (input: { title: string; startAt: string | null; endAt: string | null; notes: string; completed?: boolean }, taskId: string | null, dateKey: string) => void
  deleteTask: (taskId: string) => void
  addHabit: (input: { title: string; description: string }) => void
  addGoal: (input: { title: string; description: string; categoryId: string }) => void
  saveSummary: (summary: MockSummary) => void
  setReminderEnabled: (enabled: boolean) => void
}

const today = new Date()
const { tasks: seedTasks, plans: seedPlans } = buildSeedDayData(today)

export const useMockStore = create<MockState>((set) => ({
  habits: [...SEED_HABITS],
  habitLogs: buildSeedHabitLogs(SEED_HABITS, today),
  goals: SEED_GOALS.map((goal) => ({ ...goal, months: goal.months.map((month) => ({ ...month, days: month.days.map((day) => ({ ...day })) })) })),
  goalDayOverrides: {},
  tasks: seedTasks,
  plans: seedPlans,
  taskOverrides: {},
  planOverrides: {},
  summaries: buildSeedSummaries(today),
  reminderEnabled: false,

  toggleHabitCheckin: (habitId, dateKey) =>
    set((state) => {
      const key = `${habitId}:${dateKey}`
      const logs = { ...state.habitLogs }
      if (logs[key]) delete logs[key]
      else logs[key] = true
      return { habitLogs: logs }
    }),

  toggleGoalDay: (dayId) =>
    set((state) => {
      // override 记录最终态（而非增量），需结合种子 done 值计算翻转结果
      const day = state.goals.flatMap((goal) => goal.months).flatMap((month) => month.days).find((item) => item.id === dayId)
      if (!day) return {}
      const effective = state.goalDayOverrides[dayId] ?? day.done
      return { goalDayOverrides: { ...state.goalDayOverrides, [dayId]: !effective } }
    }),

  toggleTask: (dateKey, taskId) =>
    set((state) => ({
      taskOverrides: { ...state.taskOverrides, [`task:${dateKey}:${taskId}`]: !state.taskOverrides[`task:${dateKey}:${taskId}`] }
    })),

  togglePlan: (dateKey, planId) =>
    set((state) => ({
      planOverrides: { ...state.planOverrides, [`plan:${dateKey}:${planId}`]: !state.planOverrides[`plan:${dateKey}:${planId}`] }
    })),

  saveTask: (input, taskId, dateKey) =>
    set((state) => {
      // 入参 startAt 为 ISO 时间串，截取 HH:MM 存储
      const clock = (value: string | null) => (value ? value.slice(11, 16) : null)
      if (taskId) {
        return {
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, title: input.title, notes: input.notes, startAt: clock(input.startAt), endAt: clock(input.endAt), completed: input.completed ?? task.completed }
              : task
          )
        }
      }
      const next: MockTask = {
        id: `t-${Date.now()}`,
        dateKey,
        title: input.title,
        notes: input.notes,
        startAt: clock(input.startAt),
        endAt: clock(input.endAt),
        durationMinutes: null,
        completed: input.completed ?? false
      }
      return { tasks: [...state.tasks, next] }
    }),

  deleteTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((task) => task.id !== taskId) })),

  addHabit: (input) =>
    set((state) => ({
      habits: [
        ...state.habits,
        { id: `h-${Date.now()}`, title: input.title, description: input.description || '每天', frequency: { type: 'daily' }, taskTime: null, durationMinutes: null }
      ]
    })),

  addGoal: (input) =>
    set((state) => ({
      goals: [
        ...state.goals,
        { id: `g-${Date.now()}`, title: input.title, description: input.description, categoryId: input.categoryId, icon: 'flag' as const, status: 'active' as const, months: [] }
      ]
    })),

  saveSummary: (summary) =>
    set((state) => {
      const exists = state.summaries.some((item) => item.id === summary.id)
      return {
        summaries: exists ? state.summaries.map((item) => (item.id === summary.id ? summary : item)) : [summary, ...state.summaries]
      }
    }),

  setReminderEnabled: (reminderEnabled) => set({ reminderEnabled })
}))

export { CATEGORIES, toDateKey }
