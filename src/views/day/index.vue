<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground selection:bg-primary selection:text-primary-foreground relative">
    <div class="flex flex-1 h-full relative overflow-hidden bg-zinc-50/50">
      <!-- Sidebar Panel -->
      <Sidebar
        :class="['transition-opacity duration-300 ease-in-out', isReady ? 'opacity-100' : 'opacity-0']"
        @go-back="goBackToMonth"
        @scroll-to-task="scrollToTask"
        @add-event="openAddModal"
        @edit-task="openEditModal"
      />
      
      <!-- Main Timeline Area -->
      <Timeline
        ref="timeline"
        :class="['transition-opacity duration-300 ease-in-out', isReady ? 'opacity-100' : 'opacity-0']"
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
const isReady = ref(false) // 控制页面初始显示状态以隐藏滚动闪烁

// 页面加载时的动态时间线更新及初始滚动位置设置
onMounted(async () => {
  validateDayRoute()

  // 1. 加载日程相关数据
  await fetchTasks()
  
  await nextTick()
  const schedule = dailySchedule.value
  
  // 2. 决定滚动位置：如果有任务，优先找第一个未完成的；全完成则找第一个；没有任务则跳转 08:00
  if (schedule.length > 0) {
    const firstUncompletedIndex = schedule.findIndex(task => !task.completed)
    const targetIndex = firstUncompletedIndex !== -1 ? firstUncompletedIndex : 0
    scrollToTask(targetIndex, 'instant')
  } else {
    const defaultEl = document.getElementById('hour-8')
    if (defaultEl) {
      defaultEl.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }

  // 滚动完成后，显示内容
  requestAnimationFrame(() => {
    setTimeout(() => {
      isReady.value = true
    }, 50) // 给予一小段缓冲让 DOM 稳定渲染和跳转完毕
  })

  // 更新当前时间指示线：每秒重新计算最新时间
  setInterval(updateCurrentHour, 1000)
})
</script>