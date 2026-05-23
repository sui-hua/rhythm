import { computed } from 'vue'
import { useDayStore } from '@/stores/dayStore'

export function useDayData() {
    const store = useDayStore()
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
        handleStartTask: store.handleStartTask.bind(store)
    }
}
