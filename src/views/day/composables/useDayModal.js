import { ref, computed } from 'vue'
import { useDayStore } from '@/stores/dayStore'

export function useDayModal() {
    const dayStore = useDayStore()

    const showAddModal = ref(false)
    const editingTaskId = ref(null)

    const editingTask = computed(() => {
        if (editingTaskId.value !== null && dayStore.dailySchedule) {
            return dayStore.dailySchedule.find(t => t.id === editingTaskId.value) || null
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
