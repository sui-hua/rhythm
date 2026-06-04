import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { useDayStore } from '@/stores/dayStore'

/** 日程项（来自 dayStore.dailySchedule 的元素） */
export interface ScheduleItem {
    id: string
    [key: string]: unknown
}

/**
 * 日程编辑弹窗管理
 * 控制添加/编辑弹窗的显示状态和当前编辑的任务
 */
export function useDayModal() {
    const dayStore = useDayStore()

    // 弹窗是否可见
    const showAddModal: Ref<boolean> = ref(false)
    // 当前编辑的任务 ID，null 表示新建模式
    const editingTaskId: Ref<string | null> = ref(null)

    // 根据 editingTaskId 从 dailySchedule 中查找对应任务
    const editingTask: ComputedRef<ScheduleItem | null> = computed(() => {
        if (editingTaskId.value !== null && dayStore.dailySchedule) {
            return (dayStore.dailySchedule as ScheduleItem[]).find(
                t => t.id === editingTaskId.value
            ) || null
        }
        return null
    })

    // 打开新建弹窗
    const openAddModal = () => {
        editingTaskId.value = null
        showAddModal.value = true
    }

    // 打开编辑弹窗，传入任务 ID
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
