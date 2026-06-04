import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useDayStore } from '@/stores/dayStore'

/** 日程项（来自 dayStore.dailySchedule 的元素） */
export interface ScheduleItem {
    id: string
    [key: string]: unknown
}

/**
 * 日程编辑弹窗管理 Composable
 *
 * 使用场景：Day 页面的任务添加/编辑弹窗控制
 * 数据流：dayStore.dailySchedule → editingTask → 弹窗组件
 */
export function useDayModal() {
    const dayStore = useDayStore()

    // 弹窗是否可见，控制添加/编辑弹窗的显示隐藏
    const showAddModal: Ref<boolean> = ref(false)
    // 当前编辑的任务 ID，null 表示新建模式
    const editingTaskId: Ref<string | null> = ref(null)

    /**
     * 根据 editingTaskId 从 dailySchedule 中查找对应任务
     * 当 editingTaskId 为 null 时表示新建模式，返回 null
     */
    const editingTask: ComputedRef<ScheduleItem | null> = computed(() => {
        if (editingTaskId.value !== null && dayStore.dailySchedule) {
            return (dayStore.dailySchedule as ScheduleItem[]).find(
                t => t.id === editingTaskId.value
            ) || null
        }
        return null
    })

    /**
     * 打开新建弹窗
     * 清空 editingTaskId 以标记为新建模式
     */
    const openAddModal = () => {
        editingTaskId.value = null
        showAddModal.value = true
    }

    /**
     * 打开编辑弹窗
     * 设置 editingTaskId 以触发 editingTask 计算，弹窗组件通过该值获取任务详情
     */
    const openEditModal = (id: string) => {
        editingTaskId.value = id
        showAddModal.value = true
    }

    return {
        showAddModal,
        editingTaskId,
        editingTask,
        openAddModal,
        openEditModal
    }
}
