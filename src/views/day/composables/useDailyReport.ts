// 日报弹窗管理：显示/隐藏、统计数据构建、防重复弹窗机制（通过 dailyReportLog 表记录）
import { ref } from 'vue'
import type { Ref } from 'vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { toDateOnly, getDayRange } from '@/utils/dateFormatter'

/** 日报统计数据结构 */
export interface ReportStats {
    yesterdayCompleted: number
    yesterdayUncompleted: number
    todayTotal: number
    carryoverToToday: number
}

/**
 * 日报弹窗 composable
 * 每次调用创建独立实例，避免多组件共享同一状态
 * 通过 dailyReportLog 表记录防重复弹窗
 */
export const useDailyReport = () => {
    const authStore = useAuthStore()

    // 弹窗是否可见
    const reportVisible: Ref<boolean> = ref(false)
    // 日报统计数据
    const reportStats: Ref<ReportStats> = ref({
        yesterdayCompleted: 0,
        yesterdayUncompleted: 0,
        todayTotal: 0,
        carryoverToToday: 0
    })
    // 加载状态
    const isLoading: Ref<boolean> = ref(false)

    // 构建统计数据：拉取昨日和今日的任务并汇总
    const buildStats = async () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)

        const { start: yStart, end: yEnd } = getDayRange(yesterday)
        const { start: tStart, end: tEnd } = getDayRange(today)

        const [yesterdayTasks, todayTasks] = await Promise.all([
            db.task.list(yStart, yEnd),
            db.task.list(tStart, tEnd)
        ])

        const yCompleted = (yesterdayTasks || []).filter((t: any) => t.completed).length
        const yUncompleted = (yesterdayTasks || []).length - yCompleted
        const todayTotal = (todayTasks || []).length

        // 顺延到今天：与顺延规则一致（只统计创建时间在 7 天内的未完成任务）
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000
        const carryoverToToday = (yesterdayTasks || []).filter((t: any) => {
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

    // 按需打开日报弹窗：检查今日是否已查看过
    const openIfNeeded = async () => {
        const userId = authStore.userId
        if (!userId) return

        const todayKey = toDateOnly(new Date())

        try {
            isLoading.value = true
            const existing = await db.dailyReportLog.getByUserAndDate(userId, todayKey)
            if (existing) return

            await buildStats()
            reportVisible.value = true
        } catch (e) {
            console.error('获取日报失败:', e)
        } finally {
            isLoading.value = false
        }
    }

    // 关闭日报弹窗并记录查看状态
    const closeReport = async () => {
        reportVisible.value = false

        const userId = authStore.userId
        if (!userId) return

        const todayKey = toDateOnly(new Date())
        try {
            await db.dailyReportLog.create({
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
