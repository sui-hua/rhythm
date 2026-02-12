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
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Timeline from './components/Timeline.vue'
import AddEventModal from './components/AddEventModal.vue'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 月份数据
const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
const monthsFull = ['一月 (January)', '二月 (February)', '三月 (March)', '四月 (April)', '五月 (May)', '六月 (June)', '七月 (July)', '八月 (August)', '九月 (September)', '十月 (October)', '十一月 (November)', '十二月 (December)']

// 当前选中的月份和日期
const selectedMonth = computed(() => {
  const monthIndex = parseInt(route.params.monthIndex) - 1
  return {
    name: months[monthIndex],
    full: monthsFull[monthIndex],
    index: monthIndex
  }
})

const selectedDay = computed(() => parseInt(route.params.day))

// 日日程数据
import { db } from '@/services/database'

const tasks = ref([])

const fetchTasks = async () => {
  try {
    // Construct date range for the selected day
    // Using 2026 as the base year based on project context
    const year = 2026
    const month = selectedMonth.value.index
    const day = selectedDay.value
    
    // Create dates in local time
    const startOfDay = new Date(year, month, day, 0, 0, 0)
    const endOfDay = new Date(year, month, day, 23, 59, 59)
    
    tasks.value = await db.tasks.list(startOfDay, endOfDay)
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
  }
}

const dailySchedule = computed(() => {
  return tasks.value.map(task => {
    // Convert DB timestamp to HH:MM format for local UI logic
    const startDate = new Date(task.start_time)
    const endDate = new Date(task.end_time)
    
    const startHourVal = startDate.getHours() + startDate.getMinutes() / 60
    const endHourVal = endDate.getHours() + endDate.getMinutes() / 60
    const durationHours = endHourVal - startHourVal
    
    const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
    
    return {
      id: task.id,
      original: task,
      startHour: startHourVal,
      durationHours,
      rawDuration: durationHours,
      time: startTimeStr,
      duration: durationHours.toFixed(1) + '小时',
      category: '个人任务',
      title: task.title,
      description: task.description,
      completed: task.completed
    }
  }).sort((a, b) => a.startHour - b.startHour)
})

const timeline = ref(null)
const now = new Date();
const currentHour = ref(now.getHours() + now.getMinutes() / 60);

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

const handleAddEvent = async (eventData) => {
  const [hours, minutes] = eventData.time.split(':').map(Number)
  const duration = parseFloat(eventData.duration)
  
  // Construct Date objects
  const year = 2026
  const month = selectedMonth.value.index
  const day = selectedDay.value
  
  const startTime = new Date(year, month, day, hours, minutes)
  const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000)
  
  try {
    // Get userId from pinia store
    const userId = authStore.userId
    if (!userId) {
      console.error('User not authenticated')
      return
    }

    await db.tasks.create({
      user_id: userId,
      title: eventData.title,
      description: eventData.description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      completed: false,
    })
    await fetchTasks()
  } catch (e) {
    console.error('Add task failed', e)
  }
  
  showAddModal.value = false
}

const handleUpdateEvent = async (updatedData) => {
  if (editingTaskIndex.value !== null) {
    const task = dailySchedule.value[editingTaskIndex.value]
    if (task) {
        const [hours, minutes] = updatedData.time.split(':').map(Number)
        const duration = parseFloat(updatedData.duration)
        
        const year = 2026
        const month = selectedMonth.value.index
        const day = selectedDay.value
        
        const startTime = new Date(year, month, day, hours, minutes)
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000)

        try {
            await db.tasks.update(task.id, {
                title: updatedData.title,
                description: updatedData.description,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
            })
            await fetchTasks()
        } catch (e) {
            console.error('Update task failed', e)
        }
    }
  }
  showAddModal.value = false
}

const handleDeleteEvent = async () => {
  if (editingTaskIndex.value !== null) {
    const task = dailySchedule.value[editingTaskIndex.value]
    if (task) {
      try {
        await db.tasks.delete(task.id)
        await fetchTasks()
      } catch (e) {
        console.error('Delete task failed', e)
      }
    }
  }
  showAddModal.value = false
}

// 交互逻辑
const toggleComplete = async (index) => {
  const task = dailySchedule.value[index]
  if (task) {
      try {
          await db.tasks.update(task.id, { completed: !task.completed })
          await fetchTasks()
      } catch (e) {
          console.error('Toggle complete failed', e)
      }
  }
}

const scrollToTask = (index, behavior = 'smooth') => {
  const el = document.getElementById(`task-${index}`)
  if (el) el.scrollIntoView({ behavior, block: 'center' })
}

// 返回月视图
const goBackToMonth = () => {
  router.push(`/month/${selectedMonth.value.index + 1}`)
}

// 动态时间线更新模拟
onMounted(async () => {
  // 1. 立即尝试滚动到 08:00 (默认位置)
  // 此时数据还没加载，先让用户看到 08:00
  await nextTick()
  const defaultEl = document.getElementById('hour-8')
  if (defaultEl) {
    defaultEl.scrollIntoView({ behavior: 'instant', block: 'start' })
  }

  // 2. 加载数据
  await fetchTasks()
  
  // 3. 如果有任务，修正滚动位置到第一个任务
  // 使用 nextTick 确保任务元素已渲染
  await nextTick()
  if (dailySchedule.value.length > 0) {
    scrollToTask(0)
  }

  // 更新当前时间
  setInterval(() => {
    const now = new Date();
    currentHour.value = now.getHours() + now.getMinutes() / 60;
  }, 1000);

  // 确保参数有效
  const monthIndex = parseInt(route.params.monthIndex)
  const day = parseInt(route.params.day)
  if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12 || isNaN(day) || day < 1 || day > 31) {
    router.push('/year')
  }
})



</script>