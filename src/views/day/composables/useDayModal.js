import { ref, computed } from 'vue'
import { useDayData } from './useDayData'

export function useDayModal() {
    const { dailySchedule } = useDayData()

    const showAddModal = ref(false)
    const editingTaskId = ref(null)

    const editingTask = computed(() => {
        if (editingTaskId.value !== null && dailySchedule.value) {
            return dailySchedule.value.find(t => t.id === editingTaskId.value) || null
        }
        return null
    })

    const openAddModal = () => {
        editingTaskId.value = null
        showAddModal.value = true
    }

    const openEditModal = (id) => {
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
