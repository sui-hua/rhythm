import { computed } from 'vue'
import { useDayStore } from '@/stores/dayStore'

export function useDayData() {
    const store = useDayStore()

    /**
     * 更新任务的开始/结束时间（拖拽编排使用）
     *
     * @description 根据新的小时数计算 ISO 时间字符串并写入数据库，
     *             然后刷新当前日期的任务列表
     * @param {Object} task - 日程执行项（仅 type='task' 有效）
     * @param {number} newStartHour - 新的开始小时（浮点数，如 9.5 = 09:30）
     * @param {number} newEndHour - 新的结束小时（浮点数）
     * @returns {Promise<void>}
     */
    const updateTaskTime = async (task, newStartHour, newEndHour) => {
        if (!task || task.type !== 'task') return
        await store.updateTaskTime(task, newStartHour, newEndHour)
    }

    return {
        isLoading: computed(() => store.isLoading),
        setLoading: store.setLoading.bind(store),
        selectedMonth: computed(() => store.selectedMonth),
        selectedDay: computed(() => store.selectedDay),
        dailySchedule: computed(() => store.dailySchedule),
        completedCount: computed(() => store.completedCount),
        fetchTasks: store.fetchTasks.bind(store),
        carryOverUncompletedTasksTo: store.carryOverUncompletedTasksTo.bind(store),
        handleToggleComplete: store.handleToggleComplete.bind(store),
        handleStartTask: store.handleStartTask.bind(store),
        updateTaskTime
    }
}
