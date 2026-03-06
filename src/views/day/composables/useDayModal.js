import { ref, computed } from 'vue'
import { useDayData } from './useDayData'

/**
 * Day 视图模态框控制层 (Composable)
 * 托管“新建/编辑”对话框的状态和数据
 */
export function useDayModal() {
    const { dailySchedule } = useDayData()
    const showAddModal = ref(false)
    const editingTaskIndex = ref(null)

    const editingTask = computed(() => {
        if (editingTaskIndex.value !== null && dailySchedule.value) {
            return dailySchedule.value[editingTaskIndex.value]
        }
        return null
    })

    const openAddModal = () => {
        editingTaskIndex.value = null
        showAddModal.value = true
    }

    const openEditModal = (index) => {
        editingTaskIndex.value = index
        showAddModal.value = true
    }

    return {
        showAddModal,
        editingTaskIndex,
        editingTask,
        openAddModal,
        openEditModal
    }
}
