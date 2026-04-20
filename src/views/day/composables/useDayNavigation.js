/**
 * ============================================
 * Day 视图导航管理 (views/day/composables/useDayNavigation.js)
 * ============================================
 *
 * 【模块职责】
 * - Day 视图的导航和交互管理
 * - 路由校验与自动跳转
 * - 当前时间线指示器
 * - 滚动定位到当前/首个未完成任务
 * - 首次访问日的日报弹窗逻辑
 *
 * 【初始化流程】
 * 1. validateDayRoute() → 校验路由参数合法性
 * 2. handleFirstEntryForDay() → 首次访问显示日报弹窗
 * 3. syncDateWithRoute() → 同步日期到 dateStore
 * 4. fetchTasks() → 加载日程数据
 * 5. 滚动定位 → 定位到首个未完成任务或默认位置
 *
 * 【时间线逻辑】
 * - updateCurrentHour() → 每秒更新当前小时指示器
 * - 定时器 setInterval(updateCurrentHour, 1000)
 *
 * @module useDayNavigation
 * @see {@link https://github.com/example/rhythm} for more details
 */
import { ref, nextTick, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDayData } from './useDayData'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { buildDayPath, getRouteDateContext } from '@/views/day/utils/routeDateContext'
import { getInitialScrollTarget } from '@/views/day/composables/getInitialScrollTarget'

/**
 * Day 视图导航与交互管理 (Composable)
 * 包含路由校验跳转、当前时间指针、滚动定位以及页面初始化
 *
 * @function useDayNavigation
 * @returns {Object} Day 视图导航相关状态和方法
 * @returns {Ref<number>} returns.currentHour - 当前小时数（浮点数，例：14.5 表示 14:30）
 * @returns {Ref<boolean>} returns.isReady - 页面是否已完成初始化（用于淡入动画）
 * @returns {Ref<boolean>} returns.isLoading - 任务数据加载状态
 * @returns {Function} returns.scrollToTask - 滚动到指定任务
 * @returns {Function} returns.updateCurrentHour - 手动更新当前小时指示器
 * @returns {Function} returns.validateDayRoute - 校验路由参数合法性
 */
export function useDayNavigation() {
    const { dailySchedule, fetchTasks, isLoading } = useDayData()
    const router = useRouter()
    const route = useRoute()
    const dateStore = useDateStore()
    const { openIfNeeded } = useDailyReport()

    const currentHour = ref(new Date().getHours() + new Date().getMinutes() / 60)
    const isReady = ref(false)

    /**
     * 滚动到指定任务项
     * @param {number} index - 任务在日程列表中的索引
     * @param {ScrollBehavior} [behavior='smooth'] - 滚动行为：'smooth' | 'instant'
     */
    const scrollToTask = (index, behavior = 'smooth') => {
        const el = document.getElementById(`task-${index}`)
        if (el) el.scrollIntoView({ behavior, block: 'center' })
    }

    /**
     * 更新当前小时指示器
     * 每秒调用一次，将 currentHour 更新为当前时间的浮点数小时值
     * @example 14:30 → 14.5
     */
    const updateCurrentHour = () => {
        const now = new Date()
        currentHour.value = now.getHours() + now.getMinutes() / 60
    }

    /**
     * 校验路由参数合法性
     * 检查 URL 中的 year/month/day 参数是否为有效日期格式
     * 若参数缺失或非规范格式，自动重定向到规范路径
     * @returns {boolean} 路由是否合法有效
     */
    const validateDayRoute = () => {
        const context = getRouteDateContext(route.params, dateStore.currentDate)

        if (!context.hasParsedParams) {
            router.replace(buildDayPath(context.date))
            return false
        }

        if (!context.isCanonical) {
            router.replace(buildDayPath(context.date))
            return false
        }

        return true
    }

    /**
     * 判断两个日期是否为同一天
     * @param {Date} a - 第一个日期
     * @param {Date} b - 第二个日期
     * @returns {boolean} 是否为同一天
     */
    const isSameDay = (a, b) => {
        return a.getFullYear() === b.getFullYear()
            && a.getMonth() === b.getMonth()
            && a.getDate() === b.getDate()
    }

    /**
     * 处理当日首次访问逻辑
     * 当用户首次访问当天时，检查是否需要显示日报弹窗
     * @param {Date} targetDate - 目标日期
     * @returns {Promise<void>}
     */
    const handleFirstEntryForDay = async (targetDate) => {
        if (!targetDate) return
        const today = new Date()
        // DB-based: openIfNeeded() will check daily_report_views to decide whether to show the modal.
        if (isSameDay(targetDate, today)) await openIfNeeded()
    }

    /**
     * 从路由参数获取目标日期
     * @returns {Date} 目标日期
     */
    const getTargetDateFromRoute = () => {
        return getRouteDateContext(route.params, dateStore.currentDate).date
    }

    /**
     * 将路由参数同步到 dateStore
     * 从 URL 提取 year/month/day 并更新全局日期状态
     */
    const syncDateWithRoute = () => {
        const { year, month, day } = getRouteDateContext(route.params, dateStore.currentDate)
        dateStore.setYearMonthDay(year, month - 1, day)
    }

    /**
     * 滚动到初始目标位置
     * 根据目标日期和日程情况决定滚动位置：
     * - 若有未完成任务：滚动到该任务
     * - 否则滚动到当前时间点或默认 8:00
     * @param {Date} targetDate - 目标日期
     */
    const scrollToInitialTarget = (targetDate) => {
        const initialTarget = getInitialScrollTarget({
            schedule: dailySchedule.value,
            targetDate,
            now: new Date()
        })

        if (initialTarget.type === 'task') {
            scrollToTask(initialTarget.index, 'instant')
            return
        }

        const hour = initialTarget.type === 'current-time'
            ? initialTarget.hour
            : 8
        const targetEl = document.getElementById(`hour-${hour}`)

        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'instant', block: 'start' })
        }
    }

    /**
     * 处理路由同步
     * 完整初始化流程：校验路由 → 处理首次访问 → 同步日期 → 加载数据
     * @returns {Promise<boolean>} 是否初始化成功
     */
    const handleRouteSync = async () => {
        if (!validateDayRoute()) return false

        const targetDate = getTargetDateFromRoute()
        await handleFirstEntryForDay(targetDate)
        syncDateWithRoute()
        await fetchTasks({ showLoading: true })
        return true
    }

    // 页面挂载初始化：校验路由、加载数据、滚动定位、淡入显示、启动时间线刷新
    onMounted(async () => {
        const isValid = await handleRouteSync()
        if (!isValid) return

        await nextTick()
        scrollToInitialTarget(getTargetDateFromRoute())

        requestAnimationFrame(() => {
            setTimeout(() => {
                isReady.value = true
            }, 50)
        })

        setInterval(updateCurrentHour, 1000)
    })

    watch(
        () => [route.params.year, route.params.month, route.params.day],
        async () => {
            await handleRouteSync()
        }
    )

    return {
        currentHour,
        isReady,
        isLoading,
        scrollToTask,
        updateCurrentHour,
        validateDayRoute
    }
}
