/**
 * ============================================
 * 日报弹窗管理 (views/day/composables/useDailyReport.js)
 * ============================================
 *
 * 【模块职责】
 * - 管理日报弹窗的显示/隐藏
 * - 构建昨日/今日统计数据
 * - 记录用户是否已查看日报（避免重复弹窗）
 *
 * 【统计数据 - reportStats】
 * - yesterdayCompleted → 昨日已完成任务数
 * - yesterdayUncompleted → 昨日未完成任务数
 * - todayTotal → 今日总任务数
 * - carryoverToToday → 顺延到今天的未完成任务数
 *
 * 【防重复机制】
 * - 通过 dailyReportViews 表记录用户已查看的日期
 * - 同一用户同一天只弹一次
 */
import { ref } from 'vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'

const reportVisible = ref(false)
const reportStats = ref({
  yesterdayCompleted: 0,
  yesterdayUncompleted: 0,
  todayTotal: 0,
  carryoverToToday: 0
})
const isLoading = ref(false)

const formatDateKey = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getDayRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
  return { start, end }
}

export const useDailyReport = () => {
  const authStore = useAuthStore()

  const buildStats = async () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    const { start: yStart, end: yEnd } = getDayRange(yesterday)
    const { start: tStart, end: tEnd } = getDayRange(today)

    const [yesterdayTasks, todayTasks] = await Promise.all([
      db.tasks.list(yStart, yEnd),
      db.tasks.list(tStart, tEnd)
    ])

    const yCompleted = (yesterdayTasks || []).filter(t => t.completed).length
    const yUncompleted = (yesterdayTasks || []).length - yCompleted
    const todayTotal = (todayTasks || []).length

    // 顺延到今天：与顺延规则一致（只统计创建时间在 7 天内的未完成任务）
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000
    const carryoverToToday = (yesterdayTasks || []).filter(t => {
      if (t.completed) return false
      const createdAt = t.created_at ? new Date(t.created_at) : null
      if (!createdAt || isNaN(createdAt.getTime())) return false
      return (tStart.getTime() - createdAt.getTime()) < oneWeekMs
    }).length

    reportStats.value = {
      yesterdayCompleted: yCompleted,
      yesterdayUncompleted: yUncompleted,
      todayTotal,
      carryoverToToday
    }
  }

  const openIfNeeded = async () => {
    const userId = authStore.userId
    if (!userId) return

    const todayKey = formatDateKey(new Date())

    try {
      isLoading.value = true
      const existing = await db.dailyReportViews.getByUserAndDate(userId, todayKey)
      if (existing) return

      await buildStats()
      reportVisible.value = true
    } catch (e) {
      console.error('获取日报失败:', e)
    } finally {
      isLoading.value = false
    }
  }

  const closeReport = async () => {
    reportVisible.value = false

    const userId = authStore.userId
    if (!userId) return

    const todayKey = formatDateKey(new Date())
    try {
      await db.dailyReportViews.create({
        user_id: userId,
        report_date: todayKey
      })
    } catch (e) {
      console.error('记录日报查看状态失败:', e)
    }
  }

  return {
    reportVisible,
    reportStats,
    isLoading,
    openIfNeeded,
    closeReport
  }
}
