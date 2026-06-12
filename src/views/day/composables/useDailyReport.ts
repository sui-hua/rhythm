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
 * 日报弹窗 Composable
 *
 * 使用场景：Day 页面进入时展示昨日任务完成情况统计
 * 数据流：db.task → buildStats → reportStats → 弹窗组件
 *
 * 每次调用创建独立实例，避免多组件共享同一状态
 * 通过 dailyReportLog 表记录防重复弹窗，确保每天只弹一次
 */
export const useDailyReport = () => {
    const authStore = useAuthStore()

    // 弹窗是否可见
    const reportVisible: Ref<boolean> = ref(false)
    // 日报统计数据，包含昨日完成/未完成、今日总数、顺延数
    const reportStats: Ref<ReportStats> = ref({
        yesterdayCompleted: 0,
        yesterdayUncompleted: 0,
        todayTotal: 0,
        carryoverToToday: 0
    })
    // 加载状态，用于控制弹窗显示时机和按钮禁用
    const isLoading: Ref<boolean> = ref(false)

    /**
     * 构建统计数据
     * 并行拉取昨日和今日的任务，汇总完成/未完成/顺延数量
     */
    const buildStats = async () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)

        const { start: yStart, end: yEnd } = getDayRange(yesterday)
        const { start: tStart, end: tEnd } = getDayRange(today)

        // 并行请求减少等待时间
        const [yesterdayTasks, todayTasks] = await Promise.all([
            db.task.list(yStart, yEnd),
            db.task.list(tStart, tEnd)
        ])

        const yCompleted = (yesterdayTasks || []).filter(t => t.completed).length
        const yUncompleted = (yesterdayTasks || []).length - yCompleted
        const todayTotal = (todayTasks || []).length

        // 顺延规则：只统计创建时间在 7 天内的未完成任务，与任务顺延逻辑保持一致
        const oneWeekMs = 7 * 24 * 60 * 60 * 1000
        const carryoverToToday = (yesterdayTasks || []).filter(t => {
            if (t.completed) return false
            const createdAt = t.created_at ? new Date(t.created_at) : null
            // 跳过创建时间无效的任务，避免 NaN 参与计算
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

    /**
     * 按需打开日报弹窗
     * 先检查 dailyReportLog 表，今日已查看则跳过，避免重复弹窗打扰用户
     */
    const openIfNeeded = async () => {
        const userId = authStore.userId
        if (!userId) return

        const todayKey = toDateOnly(new Date())

        try {
            isLoading.value = true
            // 查询今日是否已有查看记录
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

    /**
     * 关闭日报弹窗并记录查看状态
     * 写入 dailyReportLog 表，确保下次进入不再弹出
     */
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
            // 记录失败不影响用户体验，仅打印错误
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
