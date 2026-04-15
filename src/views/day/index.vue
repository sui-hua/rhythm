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

      <!-- Mobile Sidebar Toggle -->
      <button
        v-if="isMobile"
        class="fixed top-4 left-4 z-30 w-10 h-10 bg-background/80 backdrop-blur-sm border border-border/50 text-foreground rounded-full shadow-sm flex items-center justify-center transition-transform active:scale-95"
        @click="showSidebar = true"
        aria-label="打开侧边栏"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Mobile Add Task Button -->
      <button
        v-if="isMobile"
        class="fixed bottom-6 right-6 z-30 w-11 h-11 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        @click="openQuickAdd"
        aria-label="新增任务"
      >
        <Plus class="w-5 h-5" />
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

      <!-- Quick Add Drawer (移动端快速添加) -->
      <QuickAddDrawer
        v-if="isMobile"
        v-model:show="showQuickAdd"
        @switch-to-full="openFullAddModal"
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
// Day 视图主页面：整合时间轴、侧边栏、各类弹窗和移动端抽屉
// 统一聚合 Task、DailyPlan、Habit 三种数据源
import { ref, defineAsyncComponent, watch, onBeforeUnmount, onMounted } from 'vue'
import { Menu, Plus } from 'lucide-vue-next'
import Sidebar from '@/views/day/components/Sidebar.vue'
import Timeline from '@/views/day/components/Timeline.vue'
import DailyReportModal from '@/views/day/components/DailyReportModal.vue'
import PomodoroTimerModal from '@/views/day/components/PomodoroTimerModal.vue'
import QuickAddDrawer from '@/views/day/components/QuickAddDrawer.vue'
import { useDayNavigation } from '@/views/day/composables/useDayNavigation'
import { useDayModal } from '@/views/day/composables/useDayModal'
import { useMobile } from '@/composables/useMobile'
import { useUiStore } from '@/stores/uiStore'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { useDayData } from '@/views/day/composables/useDayData'
import { useNotifications } from '@/composables/useNotifications'

const AddEventModal = defineAsyncComponent(() => import('@/views/day/components/AddEventModal.vue'))
const MobileAddEventDrawer = defineAsyncComponent(() => import('@/views/day/components/MobileAddEventDrawer.vue'))

const { isReady, isLoading, scrollToTask, currentHour } = useDayNavigation()
const { showAddModal, editingTask, openAddModal, openEditModal } = useDayModal()

const showQuickAdd = ref(false)

// 移动端快速添加
const openQuickAdd = () => {
  showQuickAdd.value = true
}

const openFullAddModal = () => {
  showQuickAdd.value = false
  openAddModal()
}
const { isMobile } = useMobile()
const uiStore = useUiStore()
const dateStore = useDateStore()

const { reportVisible, reportStats, closeReport } = useDailyReport()
const { dailySchedule, carryOverUncompletedTasksTo, fetchTasks, setLoading } = useDayData()
const { startListening, stopListening, clearNotifiedHistory, requestPermission } = useNotifications()

onMounted(async () => {
  await requestPermission()
  startListening(() => dailySchedule.value)
})

watch(() => dateStore.currentDate, () => {
  clearNotifiedHistory()
})

const showSidebar = ref(false)
watch([showSidebar, isMobile], ([open, mobile]) => {
  uiStore.setNavbarHidden(Boolean(mobile && open))
})

onBeforeUnmount(() => {
  uiStore.setNavbarHidden(false)
  stopListening()
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
