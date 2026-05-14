import { computed, ref } from 'vue'

export function partitionInboxTasks(tasks) {
  return {
    inbox: tasks.filter((item) => item.status === 'inbox' || !item.start_time),
    scheduled: tasks.filter((item) => item.status !== 'inbox' && item.start_time)
  }
}

export function useInboxTasks(tasksRef) {
  const expanded = ref(false)
  const groups = computed(() => partitionInboxTasks(tasksRef.value || []))

  return {
    expanded,
    inboxItems: computed(() => groups.value.inbox),
    scheduledItems: computed(() => groups.value.scheduled)
  }
}
