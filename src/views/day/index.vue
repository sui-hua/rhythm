<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground selection:bg-primary selection:text-primary-foreground relative">
    <div class="flex flex-1 h-full relative overflow-hidden bg-zinc-50/50">
      <!-- Sidebar Panel -->
      <Sidebar
        :daily-schedule="dailySchedule"
        :completed-count="completedCount"
        @go-back="goBackToMonth"
        @scroll-to-task="scrollToTask"
        @refresh="fetchTasks"
        @add-event="openAddModal"
        @edit-task="openEditModal"
      />
      
      <!-- Main Timeline Area -->
      <Timeline
        ref="timeline"
        :daily-schedule="dailySchedule"
        :current-hour="currentHour"
        @edit-task="openEditModal"
        @select-task="scrollToTask"
      />

      <!-- Add/Edit Event Modal -->
      <AddEventModal
        v-model:show="showAddModal"
        :initial-data="editingTask"
        @refresh="fetchTasks"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Timeline from './components/Timeline.vue'
import AddEventModal from './components/AddEventModal.vue'

// 引入拆分后的 Composables
import { useDayData } from './composables/useDayData'
import { useDayNavigation } from './composables/useDayNavigation'
import { useDayModal } from './composables/useDayModal'

// 1. 数据层钩子 (解析日期、拉取数据并组装打卡和日程)
const { 
  selectedMonth, 
  selectedDay, // 若外部需要用到可以导出
  dailySchedule, 
  completedCount, 
  fetchTasks 
} = useDayData()

// 2. 导航及视图操作钩子 (滚动、跳转、时针、路径校验)
const {
  currentHour,
  scrollToTask,
  goBackToMonth,
  updateCurrentHour,
  validateDayRoute
} = useDayNavigation(selectedMonth)

// 3. 弹窗状态控制钩子 (新增和编辑动作)
const {
  showAddModal,
  editingTask,
  openAddModal,
  openEditModal
} = useDayModal(dailySchedule)

const timeline = ref(null) // Timeline 组件引用

// 页面加载时的动态时间线更新及初始滚动位置设置
onMounted(async () => {
  validateDayRoute()

  // 1. 立即尝试滚动到 08:00 (默认位置)
  await nextTick()
  const defaultEl = document.getElementById('hour-8')
  if (defaultEl) {
    defaultEl.scrollIntoView({ behavior: 'instant', block: 'start' })
  }

  // 2. 加载日程相关数据
  await fetchTasks()
  
  // 3. 如果有任务，修正滚动位置到第一个任务
  await nextTick()
  if (dailySchedule.value.length > 0) {
    scrollToTask(0)
  }

  // 更新当前时间指示线：每秒重新计算最新时间
  setInterval(updateCurrentHour, 1000)
})
</script>