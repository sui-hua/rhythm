import type { DailyPlanRecord, DayExecutionItem, HabitRecord } from '@/domain/day/types'
import type { TaskRecord } from '@/domain/tasks/types'

// ── 日期工具（轻量实现，避免引入 date-fns）──

export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

// 本周周一（ISO，周一为一周起点）
export function getWeekStart(date: Date): Date {
  const day = date.getDay()
  const offset = (day + 6) % 7
  return addDays(date, -offset)
}

export const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function formatCNDate(date: Date): string {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

// ── 类型定义 ──

export type MockCategory = { id: string; name: string }

export type MockTask = {
  id: string
  dateKey: string
  title: string
  notes: string
  startAt: string | null
  endAt: string | null
  durationMinutes: number | null
  completed: boolean
}

export type MockPlan = {
  id: string
  dateKey: string
  title: string
  taskTime: string | null
  durationMinutes: number | null
  completed: boolean
}

export type MockHabit = {
  id: string
  title: string
  description: string
  frequency: { type: 'daily' } | { type: 'weekly'; weekdays: number[] }
  taskTime: string | null
  durationMinutes: number | null
}

export type MockGoalDay = { id: string; title: string; done: boolean }

export type MockGoalMonth = { id: string; label: string; days: MockGoalDay[] }

export type MockGoalStatus = 'active' | 'completed'

export type MockGoal = {
  id: string
  title: string
  description: string
  categoryId: string
  icon: 'book' | 'run' | 'bot' | 'wallet' | 'coffee' | 'flag'
  status: MockGoalStatus
  months: MockGoalMonth[]
}

export type MockSummary = {
  id: string
  kind: 'daily' | 'weekly' | 'monthly' | 'yearly'
  dateKey: string
  title: string
  feeling: string
  improvement: string
  tomorrow: string
  mood: number
}

// ── 确定性伪随机：同一 key 每次生成结果一致，保证热力图/连续天数稳定 ──

function hash(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function isLogged(habitId: string, dateKey: string): boolean {
  return hash(`${habitId}:${dateKey}`) % 10 < 7
}

// ── 分类 ──

export const CATEGORIES: MockCategory[] = [
  { id: 'study', name: '学习' },
  { id: 'ai', name: 'AI' },
  { id: 'health', name: '健康' },
  { id: 'finance', name: '财务' }
]

// ── 习惯种子 ──

export const SEED_HABITS: MockHabit[] = [
  { id: 'h-early', title: '早起', description: '每天 06:30 前起床', frequency: { type: 'daily' }, taskTime: '06:30', durationMinutes: null },
  { id: 'h-read', title: '阅读', description: '每天 30 分钟', frequency: { type: 'daily' }, taskTime: '21:30', durationMinutes: 30 },
  { id: 'h-run', title: '跑步', description: '每周 3 次', frequency: { type: 'weekly', weekdays: [1, 3, 5] }, taskTime: '07:00', durationMinutes: 40 },
  { id: 'h-meditate', title: '冥想', description: '每天 10 分钟', frequency: { type: 'daily' }, taskTime: null, durationMinutes: 10 },
  { id: 'h-english', title: '英语学习', description: '每天 30 分钟', frequency: { type: 'daily' }, taskTime: '08:00', durationMinutes: 30 }
]

// ── 目标种子（5 个进行中 + 13 个已完成 + 2 个待开始，对应设计稿统计 13/5/2）──

function makeMonth(goalId: string, label: string, doneRatio: number, dayTitles: string[]): MockGoalMonth {
  const days = dayTitles.map((title, index) => ({
    id: `${goalId}-${label}-${index}`,
    title,
    done: index / dayTitles.length < doneRatio
  }))
  return { id: `${goalId}-${label}`, label, days }
}

const ACTIVE_DAY_TITLES = ['整理素材', '练习临摹', '复盘笔记', '输出总结', '对照修订', '收集参考', '完成初稿', '细节打磨']

function makeActiveGoal(
  id: string,
  title: string,
  description: string,
  categoryId: string,
  icon: MockGoal['icon'],
  ratio: number
): MockGoal {
  return {
    id,
    title,
    description,
    categoryId,
    icon,
    status: 'active',
    months: [
      makeMonth(id, '2026年8月', Math.min(1, ratio + 0.2), ACTIVE_DAY_TITLES),
      makeMonth(id, '2026年9月', Math.min(1, ratio + 0.1), ACTIVE_DAY_TITLES),
      makeMonth(id, '2026年10月', ratio, ACTIVE_DAY_TITLES)
    ]
  }
}

const COMPLETED_TITLES = [
  '搭建个人知识库',
  '完成作品集主页',
  '跑通首个半马',
  '掌握 Figma 组件体系',
  '读完《设计中的设计》',
  '建立记账习惯',
  '学会 Swift 基础',
  '整理 3 年照片备份',
  '完成年度体检',
  '学会剪辑入门',
  '搭建家庭 NAS',
  '考取驾照',
  '完成 100 天打卡挑战'
]

export const SEED_GOALS: MockGoal[] = [
  makeActiveGoal('g-design', '提升设计专业能力', '界面临摹', 'study', 'book', 0.8),
  makeActiveGoal('g-run', '每周运动 3 次', '跑步 30 分钟', 'health', 'run', 0.75),
  makeActiveGoal('g-ai', '掌握 AI 工具应用', '学习 MCP Server', 'ai', 'bot', 0.6),
  makeActiveGoal('g-save', '每月储蓄 20% 收入', '转入储蓄账户', 'finance', 'wallet', 0.4),
  makeActiveGoal('g-reading', '培养阅读习惯', '阅读《设计中的设计》', 'study', 'coffee', 0.3),
  // 待开始：无月份记录，进度 0
  { id: 'g-p1', title: '学习游泳', description: '报名基础班', categoryId: 'health', icon: 'flag', status: 'active', months: [] },
  { id: 'g-p2', title: '学习投资理财', description: '建立指数基金认知', categoryId: 'finance', icon: 'flag', status: 'active', months: [] },
  ...COMPLETED_TITLES.map((title, index) => ({
    id: `g-done-${index}`,
    title,
    description: '已达成',
    categoryId: CATEGORIES[index % CATEGORIES.length].id,
    icon: 'flag' as const,
    status: 'completed' as const,
    months: []
  }))
]

// ── 汇总种子（对应设计稿三条日总结 + 周/月/年各一条）──

export function buildSeedSummaries(today: Date): MockSummary[] {
  const d1 = toDateKey(today)
  const d2 = toDateKey(addDays(today, -1))
  const d3 = toDateKey(addDays(today, -4))
  return [
    { id: 's-d1', kind: 'daily', dateKey: d1, title: '状态很差很困', feeling: '状态很差很困', improvement: '', tomorrow: '', mood: 2 },
    { id: 's-d2', kind: 'daily', dateKey: d2, title: '今天出门拍了照', feeling: '今天出门拍了照', improvement: '后期筛选照片效率不高', tomorrow: '整理照片并归档', mood: 4 },
    { id: 's-d3', kind: 'daily', dateKey: d3, title: '今天有点累但是完成了基本任务', feeling: '今天有点累但是完成了基本任务', improvement: '午休时间可以更长一点', tomorrow: '优先推进临摹任务', mood: 3 },
    { id: 's-w1', kind: 'weekly', dateKey: d1, title: '本周节奏稳定', feeling: '任务完成率不错，运动打卡 3 次', improvement: '睡眠时间偏晚', tomorrow: '下周保持晨间流程', mood: 4 },
    { id: 's-m1', kind: 'monthly', dateKey: d1, title: '十月稳步推进', feeling: '目标推进过半，习惯基本稳定', improvement: '总结写得偏少', tomorrow: '下月加强复盘', mood: 4 },
    { id: 's-y1', kind: 'yearly', dateKey: d1, title: '年度目标过半', feeling: '专业能力与生活习惯均有沉淀', improvement: '财务目标偏慢', tomorrow: '规划明年主线', mood: 5 }
  ]
}

// ── 任务/计划种子（围绕今天生成前后几天）──

function makeTasks(today: Date): MockTask[] {
  const t = (offset: number, id: string, title: string, start: string, end: string, completed: boolean, notes = ''): MockTask => ({
    id,
    dateKey: toDateKey(addDays(today, offset)),
    title,
    notes,
    startAt: start,
    endAt: end,
    durationMinutes: null,
    completed
  })
  const todayKey = toDateKey(today)
  return [
    t(0, 't-1', '晨间阅读', '07:30', '08:00', true, '《设计中的设计》第三章'),
    t(0, 't-2', '项目复盘会', '08:30', '09:30', false),
    t(0, 't-3', '产品设计评审', '10:00', '11:30', false, '对齐移动端视觉稿'),
    t(0, 't-4', '午休', '12:30', '13:00', true),
    t(0, 't-5', '功能方案设计', '14:00', '16:00', false),
    t(0, 't-6', '运动健身', '16:30', '17:30', false),
    t(0, 't-7', '晚间复盘', '19:30', '20:00', false),
    t(-1, 't-y1', '周会', '09:30', '10:30', true),
    t(-1, 't-y2', '界面临摹练习', '14:00', '16:00', true, '完成设置页'),
    t(1, 't-m1', '需求梳理', '10:00', '11:00', false)
  ]
}

function makePlans(today: Date): MockPlan[] {
  const todayKey = toDateKey(today)
  return [
    { id: 'p-1', dateKey: todayKey, title: '整理桌面与待办', taskTime: null, durationMinutes: 15, completed: false },
    { id: 'p-2', dateKey: todayKey, title: '回复合作邮件', taskTime: null, durationMinutes: 20, completed: false }
  ]
}

// ── 选择器 ──

function toMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number)
  return h * 60 + m
}

// 组装某天的执行条目（时间轴 + 收集箱），completed 取 store 覆盖值
// original 构造为领域类型兼容形态，保证 DayScreen 的编辑流程无需感知 mock 差异
export function selectDayItems(
  dateKey: string,
  tasks: MockTask[],
  plans: MockPlan[],
  habits: MockHabit[],
  habitLogs: Record<string, true>,
  overrides: Record<string, boolean>
): { scheduledItems: DayExecutionItem[]; unscheduledItems: DayExecutionItem[] } {
  const scheduled: DayExecutionItem[] = []
  const unscheduled: DayExecutionItem[] = []

  for (const task of tasks) {
    if (task.dateKey !== dateKey) continue
    const completed = overrides[`task:${dateKey}:${task.id}`] ?? task.completed
    const original: TaskRecord = {
      id: task.id,
      title: task.title,
      startAt: task.startAt ? `${dateKey}T${task.startAt}:00` : null,
      endAt: task.endAt ? `${dateKey}T${task.endAt}:00` : null,
      notes: task.notes,
      completed
    }
    const item: DayExecutionItem = {
      id: task.id,
      source: 'task',
      title: task.title,
      description: task.notes,
      startAt: task.startAt,
      endAt: task.endAt,
      startMinutes: task.startAt ? toMinutes(task.startAt) : null,
      durationMinutes: task.durationMinutes,
      completed,
      categoryLabel: '个人任务',
      readonly: false,
      original
    }
    if (item.startMinutes !== null) scheduled.push(item)
    else unscheduled.push(item)
  }

  for (const plan of plans) {
    if (plan.dateKey !== dateKey) continue
    const completed = overrides[`plan:${dateKey}:${plan.id}`] ?? plan.completed
    const original: DailyPlanRecord = {
      id: plan.id,
      title: plan.title,
      description: '',
      day: dateKey,
      taskTime: plan.taskTime,
      duration: plan.durationMinutes,
      status: completed ? 'done' : 'pending',
      monthlyPlan: null
    }
    const item: DayExecutionItem = {
      id: plan.id,
      source: 'daily_plan',
      title: plan.title,
      description: '',
      startAt: plan.taskTime,
      endAt: null,
      startMinutes: plan.taskTime ? toMinutes(plan.taskTime) : null,
      durationMinutes: plan.durationMinutes,
      completed,
      categoryLabel: '今日计划',
      readonly: true,
      original
    }
    if (item.startMinutes !== null) scheduled.push(item)
    else unscheduled.push(item)
  }

  for (const habit of habits) {
    const completed = Boolean(habitLogs[`${habit.id}:${dateKey}`])
    const original: HabitRecord = {
      id: habit.id,
      title: habit.title,
      targetValue: '',
      taskTime: habit.taskTime,
      duration: habit.durationMinutes,
      frequency: habit.frequency,
      isArchived: false
    }
    const item: DayExecutionItem = {
      id: habit.id,
      source: 'habit',
      title: habit.title,
      description: habit.description,
      startAt: habit.taskTime,
      endAt: null,
      startMinutes: habit.taskTime ? toMinutes(habit.taskTime) : null,
      durationMinutes: habit.durationMinutes,
      completed,
      categoryLabel: '日常习惯',
      readonly: true,
      original
    }
    if (item.startMinutes !== null) scheduled.push(item)
    else unscheduled.push(item)
  }

  scheduled.sort((a, b) => (a.startMinutes ?? 0) - (b.startMinutes ?? 0))
  return { scheduledItems: scheduled, unscheduledItems: unscheduled }
}

// 习惯连续打卡天数：从今天（未打卡则从昨天）向前连续计数
export function habitStreak(habitId: string, habitLogs: Record<string, true>, today: Date): number {
  let streak = 0
  let cursor = habitLogs[`${habitId}:${toDateKey(today)}`] ? today : addDays(today, -1)
  while (habitLogs[`${habitId}:${toDateKey(cursor)}`]) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

// 本周（周一起）打卡次数
export function habitWeekCount(habitId: string, habitLogs: Record<string, true>, today: Date): number {
  const weekStart = getWeekStart(today)
  let count = 0
  for (let i = 0; i < 7; i++) {
    if (habitLogs[`${habitId}:${toDateKey(addDays(weekStart, i))}`]) count++
  }
  return count
}

// 累计打卡次数
export function habitTotalCount(habitId: string, habitLogs: Record<string, true>): number {
  return Object.keys(habitLogs).filter((key) => key.startsWith(`${habitId}:`)).length
}

// 习惯打卡状态文案（设计稿：已坚持 N 天 / 本周完成 N 次 / 今天已完成）
export function habitStatusText(
  habit: MockHabit,
  habitLogs: Record<string, true>,
  today: Date
): string {
  const todayKey = toDateKey(today)
  if (habitLogs[`${habit.id}:${todayKey}`]) return '今天已完成'
  if (habit.frequency.type === 'weekly') {
    return `本周完成 ${habitWeekCount(habit.id, habitLogs, today)} 次`
  }
  return `已坚持 ${habitStreak(habit.id, habitLogs, today)} 天`
}

// 热力图数据：以本周周一收尾的 weeks 周 × 7 天矩阵
export function habitHeatmap(
  habitId: string,
  habitLogs: Record<string, true>,
  today: Date,
  weeks: number
): { dateKey: string; logged: boolean; future: boolean }[][] {
  const weekStart = getWeekStart(today)
  const start = addDays(weekStart, -7 * (weeks - 1))
  const columns: { dateKey: string; logged: boolean; future: boolean }[][] = []
  for (let w = 0; w < weeks; w++) {
    const column = []
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d)
      const dateKey = toDateKey(date)
      column.push({
        dateKey,
        logged: Boolean(habitLogs[`${habitId}:${dateKey}`]),
        future: date.getTime() > today.getTime() && !isSameDay(date, today)
      })
    }
    columns.push(column)
  }
  return columns
}

function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}

// 目标进度：跨全部月份日计划的完成比例
export function goalProgress(goal: MockGoal, dayOverrides: Record<string, boolean>): number {
  const days = goal.months.flatMap((month) => month.days)
  if (days.length === 0) return goal.status === 'completed' ? 1 : 0
  const done = days.filter((day) => dayOverrides[day.id] ?? day.done).length
  return done / days.length
}

// 目标状态统计（已完成 / 进行中 / 待开始）
export function goalStats(goals: MockGoal[], dayOverrides: Record<string, boolean>) {
  let completed = 0
  let inProgress = 0
  let notStarted = 0
  for (const goal of goals) {
    if (goal.status === 'completed') completed++
    else if (goalProgress(goal, dayOverrides) > 0) inProgress++
    else notStarted++
  }
  return { completed, inProgress, notStarted }
}

// 按天生成种子任务与计划（应用启动时调用一次）
export function buildSeedDayData(today: Date): { tasks: MockTask[]; plans: MockPlan[] } {
  return { tasks: makeTasks(today), plans: makePlans(today) }
}

// 初始化习惯打卡记录：为每个习惯回填过去 60 天的确定性打卡数据
export function buildSeedHabitLogs(habits: MockHabit[], today: Date): Record<string, true> {
  const logs: Record<string, true> = {}
  for (const habit of habits) {
    for (let i = 0; i <= 60; i++) {
      const date = addDays(today, -i)
      if (habit.frequency.type === 'weekly' && !habit.frequency.weekdays.includes(date.getDay())) continue
      if (isLogged(habit.id, toDateKey(date))) {
        logs[`${habit.id}:${toDateKey(date)}`] = true
      }
    }
  }
  return logs
}
