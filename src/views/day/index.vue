<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-primary selection:text-primary-foreground">
    <div class="flex flex-1 h-full relative overflow-hidden bg-zinc-50/50">
      <!-- Sidebar Panel -->
      <Sidebar
        :class="[
          'transition-all duration-300 ease-in-out',
          isReady ? 'opacity-100' : 'opacity-0',
          isMobile && !showSidebar ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
        ]"
        :is-mobile="isMobile"
        :show="showSidebar"
        :is-loading="isLoading"
        @scroll-to-task="scrollToTask"
        @add-event="openAddModal"
        @edit-task="openEditModal"
        @close="showSidebar = false"
      />
      
      <!-- Main Timeline Area -->
      <Timeline
        ref="timeline"
        :class="['transition-all duration-300 ease-in-out', isReady ? 'opacity-100' : 'opacity-0']"
        :current-hour="currentHour"
        :is-loading="isLoading"
        @edit-task="openEditModal"
        @select-task="scrollToTask"
      />

      <!-- Mobile Menu Button -->
      <button 
        v-if="isMobile"
        class="fixed bottom-6 right-6 z-30 w-11 h-11 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        @click="showSidebar = !showSidebar"
      >
        <Menu v-if="!showSidebar" class="w-5 h-5" />
        <X v-else class="w-5 h-5" />
      </button>



      <!-- Add/Edit Event Modal/Drawer -->
      <AddEventModal
        v-if="!isMobile"
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />

      <MobileAddEventDrawer
        v-else
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />

      <!-- Daily Report Modal -->
      <DailyReportModal
        :show="reportVisible"
        :stats="reportStats"
        @close="closeReport"
        @confirm="handleDailyReportConfirm"
        @confirm-carryover="handleDailyReportCarryover"
      />

      <!-- Pomodoro Timer Modal -->
      <PomodoroTimerModal />
    </div>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent, watch, onBeforeUnmount } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import Sidebar from '@/views/day/components/Sidebar.vue'
import Timeline from '@/views/day/components/Timeline.vue'
import DailyReportModal from '@/views/day/components/DailyReportModal.vue'
import PomodoroTimerModal from '@/views/day/components/PomodoroTimerModal.vue'
import { useDayNavigation } from '@/views/day/composables/useDayNavigation'
import { useDayModal } from '@/views/day/composables/useDayModal'
import { useMobile } from '@/composables/useMobile'
import { useUiStore } from '@/stores/uiStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { useDayData } from '@/views/day/composables/useDayData'

const AddEventModal = defineAsyncComponent(() => import('@/views/day/components/AddEventModal.vue'))
const MobileAddEventDrawer = defineAsyncComponent(() => import('@/views/day/components/MobileAddEventDrawer.vue'))

const { isReady, isLoading, scrollToTask, currentHour } = useDayNavigation()
const { showAddModal, editingTask, openAddModal, openEditModal } = useDayModal()
const { isMobile } = useMobile()
const uiStore = useUiStore()

const { reportVisible, reportStats, closeReport } = useDailyReport()
const { carryOverUncompletedTasksTo, fetchTasks, setLoading } = useDayData()

const showSidebar = ref(false)
watch([showSidebar, isMobile], ([open, mobile]) => {
  uiStore.setNavbarHidden(Boolean(mobile && open))
})

onBeforeUnmount(() => {
  uiStore.setNavbarHidden(false)
})

const handleDailyReportConfirm = async () => {
  await closeReport()
}

const handleDailyReportCarryover = async () => {
  try {
    setLoading(true)
    await carryOverUncompletedTasksTo(new Date())
    await fetchTasks({ showLoading: false })
    await closeReport()
  } catch (e) {
    console.error('顺延任务失败:', e)
  } finally {
    setLoading(false)
  }
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
