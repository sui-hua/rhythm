import { ref, computed } from 'vue'
import { useDayData } from './useDayData'

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
