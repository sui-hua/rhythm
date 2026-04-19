import { computed, ref } from 'vue'

/**
 * Partitions tasks into inbox (unscheduled) and scheduled groups.
 * @param {Array} tasks - Array of task objects
 * @returns {{ inbox: Array, scheduled: Array }}
 */
export function partitionInboxTasks(tasks) {
  return {
    inbox: tasks.filter((item) => item.status === 'inbox' || !item.start_time),
    scheduled: tasks.filter((item) => item.status !== 'inbox' && item.start_time)
  }
}

/**
 * Composable for managing inbox tasks from a tasks ref.
 * @param {Ref<Array>} tasksRef - Reactive reference to tasks array
 */
export function useInboxTasks(tasksRef) {
  const expanded = ref(false)
  const groups = computed(() => partitionInboxTasks(tasksRef.value || []))

  return {
    expanded,
    inboxItems: computed(() => groups.value.inbox),
    scheduledItems: computed(() => groups.value.scheduled)
  }
}
