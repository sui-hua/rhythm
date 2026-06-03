<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-primary selection:text-primary-foreground">
    <div class="flex flex-1 h-full relative overflow-hidden bg-zinc-50/50">
      <Sidebar
        :is-loading="isLoading"
        @scroll-to-task="scrollToTask"
        @add-event="openAddModal"
        @edit-task="openEditModal"
      />

      <div class="relative flex-1 flex flex-col overflow-hidden">
        <Timeline
          ref="timeline"
          :class="['transition-all duration-300 ease-in-out flex-1', isReady ? 'opacity-100' : 'opacity-0']"
          :current-hour="currentHour"
          :is-loading="isLoading"
          @edit-task="openEditModal"
          @select-task="scrollToTask"
        />
      </div>

      <AddEventModal
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />

      <DailyReportModal
        :show="reportVisible"
        :stats="reportStats"
        @close="closeReport"
        @confirm="handleDailyReportConfirm"
        @confirm-carryover="handleDailyReportCarryover"
      />

      <PomodoroTimerModal />
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, watch, onBeforeUnmount, onMounted } from 'vue'
import Sidebar from '@/views/day/components/Sidebar.vue'
import Timeline from '@/views/day/components/Timeline.vue'
import DailyReportModal from '@/views/day/components/DailyReportModal.vue'
import PomodoroTimerModal from '@/views/day/components/PomodoroTimerModal.vue'
import { useDayNavigation } from '@/views/day/composables/useDayNavigation'
import { useDayModal } from '@/views/day/composables/useDayModal'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { useDayStore } from '@/stores/dayStore'
import { useNotifications } from '@/composables/useNotifications'

const AddEventModal = defineAsyncComponent(() => import('@/views/day/components/AddEventModal.vue'))

const { isReady, isLoading, scrollToTask, currentHour } = useDayNavigation()
const { showAddModal, editingTask, openAddModal, openEditModal } = useDayModal()
const dateStore = useDateStore()

const { reportVisible, reportStats, closeReport } = useDailyReport()
const dayStore = useDayStore()
const { startListening, stopListening, clearNotifiedHistory, requestPermission } = useNotifications()

onMounted(async () => {
  await requestPermission()
  startListening(() => dayStore.dailySchedule)
})

watch(() => dateStore.currentDate, () => {
  clearNotifiedHistory()
})

onBeforeUnmount(() => {
  stopListening()
})

const handleDailyReportConfirm = async () => {
  await closeReport()
}

const handleDailyReportCarryover = async () => {
  try {
    dayStore.setLoading(true)
    await dayStore.carryOverUncompletedTasksTo(new Date())
    await dayStore.fetchTasks({ showLoading: false })
    await closeReport()
  } catch (e) {
    console.error('顺延任务失败:', e)
  } finally {
    dayStore.setLoading(false)
  }
}
</script>

<style scoped>
</style>
