<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground selection:bg-primary selection:text-primary-foreground relative">
    <div class="flex flex-1 h-full relative overflow-hidden bg-zinc-50/50">
      <!-- Sidebar Panel -->
      <Sidebar
        :selected-day="selectedDay"
        :selected-month="selectedMonth"
        :daily-schedule="dailySchedule"
        :completed-count="completedCount"
        @go-back="goBackToMonth"
        @scroll-to-task="scrollToTask"
        @toggle-complete="toggleComplete"
        @add-event="openAddModal"
        @edit-task="openEditModal"
      />
      
      <!-- Main Timeline Area -->
      <Timeline
        ref="timeline"
        :selected-day="selectedDay"
        :daily-schedule="dailySchedule"
        :current-hour="currentHour"
        @edit-task="openEditModal"
        @select-task="scrollToTask"
      />

      <!-- Add/Edit Event Modal -->
      <AddEventModal
        v-model:show="showAddModal"
        :initial-data="editingTask"
        @add="handleAddEvent"
        @update="handleUpdateEvent"
        @delete="handleDeleteEvent"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Timeline from './components/Timeline.vue'
import AddEventModal from './components/AddEventModal.vue'

const router = useRouter()
const route = useRoute()

// 月份数据
const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const monthsFull = ['一月 (January)', '二月 (February)', '三月 (March)', '四月 (April)', '五月 (May)', '六月 (June)', '七月 (July)', '八月 (August)', '九月 (September)', '十月 (October)', '十一月 (November)', '十二月 (December)']

// 当前选中的月份和日期
const selectedMonth = computed(() => {
  const monthIndex = parseInt(route.params.monthIndex)
  return {
    name: months[monthIndex],
    full: monthsFull[monthIndex],
    index: monthIndex
  }
})

const selectedDay = computed(() => parseInt(route.params.day))

// 日日程数据
import { mockDb } from '@/services/mockDb'

const dailySchedule = computed(() => {
  return mockDb.tasks.value.map(task => {
    // Parse times
    const [sH, sM] = task.start_time.split(':').map(Number)
    const [eH, eM] = task.end_time.split(':').map(Number)
    const startHour = sH + sM / 60
    const endHour = eH + eM / 60
    const durationHours = endHour - startHour
    
    return {
      id: task.id, // Keep ID for updates
      original: task, // Keep ref to original
      startHour,
      durationHours,
      time: task.start_time,
      duration: durationHours.toFixed(1) + '小时',
      category: '个人任务', // Default for now
      title: task.title,
      description: task.description,
      completed: task.completed
    }
  }).sort((a, b) => a.startHour - b.startHour)
})

const timeline = ref(null)
const currentHour = ref(12.2) // 模拟当前时间位置

// 任务完成统计
const completedCount = computed(() => dailySchedule.value.filter(t => t.completed).length)

// Modal 控制
const showAddModal = ref(false)
const editingTaskIndex = ref(null)

const editingTask = computed(() => {
  if (editingTaskIndex.value !== null) {
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

const handleAddEvent = (eventData) => {
  const [hours, minutes] = eventData.time.split(':').map(Number)
  const duration = parseFloat(eventData.duration)
  // Calculate end time
  let endHours = hours + Math.floor(duration)
  let endMinutes = minutes + (duration % 1) * 60
  if (endMinutes >= 60) {
    endHours += Math.floor(endMinutes / 60)
    endMinutes = endMinutes % 60
  }
  const end_time = `${String(endHours).padStart(2,'0')}:${String(endMinutes).padStart(2,'0')}`

  mockDb.tasks.value.push({
    id: crypto.randomUUID(),
    title: eventData.title,
    description: eventData.description,
    start_time: eventData.time,
    end_time,
    completed: false,
    priority: 2
  })
  
  showAddModal.value = false
}

const handleUpdateEvent = (updatedData) => {
  if (editingTaskIndex.value !== null) {
    const task = dailySchedule.value[editingTaskIndex.value]
    if (task) {
      const original = mockDb.tasks.value.find(t => t.id === task.id)
      if (original) {
        // Calculate end time
        const [hours, minutes] = updatedData.time.split(':').map(Number)
        const duration = parseFloat(updatedData.duration)
        let endHours = hours + Math.floor(duration)
        let endMinutes = minutes + (duration % 1) * 60
        if (endMinutes >= 60) {
          endHours += Math.floor(endMinutes / 60)
          endMinutes = endMinutes % 60
        }
        const end_time = `${String(endHours).padStart(2,'0')}:${String(endMinutes).padStart(2,'0')}`

        // Update fields
        original.title = updatedData.title
        original.description = updatedData.description
        original.start_time = updatedData.time
        original.end_time = end_time
      }
    }
  }
  showAddModal.value = false
}

const handleDeleteEvent = () => {
  if (editingTaskIndex.value !== null) {
    const task = dailySchedule.value[editingTaskIndex.value]
    if (task) {
      const idx = mockDb.tasks.value.findIndex(t => t.id === task.id)
      if (idx !== -1) mockDb.tasks.value.splice(idx, 1)
    }
  }
  showAddModal.value = false
}

// 交互逻辑
const toggleComplete = (index) => {
  // Index matches the sorted dailySchedule, find the original task in mockDb
  const task = dailySchedule.value[index]
  if (task) {
    const original = mockDb.tasks.value.find(t => t.id === task.id)
    if (original) original.completed = !original.completed
  }
}

const scrollToTask = (index) => {
  const el = document.getElementById(`task-${index}`)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

// 返回月视图
const goBackToMonth = () => {
  router.push(`/month/${selectedMonth.value.index}`)
}

// 动态时间线更新模拟
onMounted(() => {
  // 页面加载后自动滚动到当前时刻
  if (timeline.value?.timelineContainer) {
    const vh = window.innerHeight / 100;
    const scrollPos = (currentHour.value - 0.5) * (25 * vh);
    timeline.value.timelineContainer.scrollTop = scrollPos;
  }

  // 更新当前时间
  setInterval(() => {
    const now = new Date();
    currentHour.value = now.getHours() + now.getMinutes() / 60;
  }, 60000);

  // 确保参数有效
  const monthIndex = parseInt(route.params.monthIndex)
  const day = parseInt(route.params.day)
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= months.length || isNaN(day) || day < 1 || day > 31) {
    router.push('/year')
  }
})
</script>