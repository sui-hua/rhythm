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

// 月份数据（中英文对照）
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

// 引入数据库操作服务
import { db } from '@/services/database'

// 响应式数据：存储当天的各种日程项目
const tasks = ref([]) // 具体任务
const dailyPlans = ref([]) // 日计划
const habits = ref([]) // 习惯
const habitLogs = ref([]) // 习惯打卡记录

const fetchTasks = async () => {
  try {
    const year = 2026
    const month = selectedMonth.value.index
    const day = selectedDay.value
    
    const startOfDay = new Date(year, month, day, 0, 0, 0)
    const endOfDay = new Date(year, month, day, 23, 59, 59)
    
    // 获取当天的任务列表
    tasks.value = await db.tasks.list(startOfDay, endOfDay)
    
    // 获取当天的“日计划”列表
    dailyPlans.value = await db.dailyPlans.listByDate(startOfDay)
    
    // 获取所有的习惯及其打卡记录
    const allHabits = await db.habits.list()
    // 过滤出未归档且设置了提醒时间的习惯
    habits.value = allHabits.filter(h => !h.archived && h.task_time)
    
    // 收集当天的习惯打卡记录，用于判断习惯是否已完成
    habitLogs.value = habits.value.flatMap(h => h.habit_logs || []).filter(log => {
      const logDate = new Date(log.completed_at)
      return logDate >= startOfDay && logDate <= endOfDay
    })
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

// 将任务、日计划、习惯整合为统一的每日日程列表，供时间轴和侧边栏渲染
const dailySchedule = computed(() => {
  const schedule = []
  
  // 1. 处理任务数据
  tasks.value.forEach(task => {
    const startDate = new Date(task.start_time)
    const endDate = new Date(task.end_time)
    
    const startHourVal = startDate.getHours() + startDate.getMinutes() / 60
    const endHourVal = endDate.getHours() + endDate.getMinutes() / 60
    const durationHours = endHourVal - startHourVal
    
    const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
    
    schedule.push({
      id: task.id,
      type: 'task',
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
    })
  })
  
  // 2. Process daily plans (assuming they have task_time)
  dailyPlans.value.forEach(plan => {
    let startHourVal, startTimeStr, durationHours, durationStr
    if (plan.task_time) {
      const [hours, minutes] = plan.task_time.split(':').map(Number)
      startHourVal = hours + minutes / 60
      startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      durationHours = 0.5 // default duration 30min
      durationStr = '30分钟'
    } else {
      startHourVal = undefined
      startTimeStr = '未安排'
      durationHours = 0
      durationStr = '-'
    }
    
    schedule.push({
      id: plan.id,
      type: 'daily_plan',
      original: plan,
      startHour: startHourVal,
      durationHours,
      rawDuration: durationHours,
      time: startTimeStr,
      duration: durationStr,
      category: '今日计划',
      title: plan.title,
      description: plan.description || '',
      completed: plan.status === 'completed'
    })
  })
  
  // 3. Process habits
  habits.value.forEach(habit => {
    let startHourVal, startTimeStr, durationHours, durationStr
    if (habit.task_time) {
      const [hours, minutes] = habit.task_time.split(':').map(Number)
      startHourVal = hours + minutes / 60
      startTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      
      const durationMins = habit.duration || 30
      durationHours = durationMins / 60
      
      if (durationHours < 1) {
          durationStr = `${durationMins}分钟`
      } else {
          durationStr = `${durationHours.toFixed(1)}小时`
      }
    } else {
      startHourVal = undefined
      startTimeStr = '未安排'
      durationHours = 0
      durationStr = '-'
    }
    
    // Check if there is a log for today
    const isCompleted = habitLogs.value.some(log => log.habit_id === habit.id)
    
    schedule.push({
      id: habit.id,
      type: 'habit',
      original: habit,
      startHour: startHourVal,
      durationHours,
      rawDuration: durationHours,
      time: startTimeStr,
      duration: durationStr,
      category: '日常习惯',
      title: habit.title,
      description: habit.target_value ? `目标: ${habit.target_value}` : '',
      completed: isCompleted
    })
  })
  
  // 按照开始时间对所有日程项目进行排序
  return schedule.sort((a, b) => {
    if (a.startHour !== undefined && b.startHour !== undefined) return a.startHour - b.startHour
    if (a.startHour !== undefined) return -1
    if (b.startHour !== undefined) return 1
    return 0
  })
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
          if (task.type === 'task') {
              // 处理普通任务：直接切换 completed 状态（ true / false ）
              await db.tasks.update(task.id, { completed: !task.completed })
          } else if (task.type === 'habit') {
              // 处理日常习惯打卡：习惯的完成是通过在 habit_logs 表中增加记录来实现的
              if (task.completed) {
                  // 如果当前是已完成状态，说明要取消打卡，需要找到当天的打卡记录并删除
                  const log = habitLogs.value.find(l => l.habit_id === task.id)
                  if (log) {
                      await db.habits.deleteLog(log.id)
                  }
              } else {
                  // 如果当前是未完成状态，说明要进行打卡，新增一条打卡记录
                  // 使用当天中午 12:00 作为打卡时间，避免跨时区计算时出现日期偏移到前一天的问题
                  const year = 2026 // TODO: 动态获取当前年份
                  const month = selectedMonth.value.index
                  const day = selectedDay.value
                  const completedDate = new Date(year, month, day, 12, 0, 0)
                  await db.habits.log(task.id, '')
              }
          } else if (task.type === 'daily_plan') {
              // 处理今日计划：支持数字类型 (0/1) 或字符串类型 ('pending'/'completed') 的状态
              const isNumeric = typeof task.original.status === 'number'
              const newStatus = isNumeric ? (task.completed ? 0 : 1) : (task.completed ? 'pending' : 'completed')
              await db.dailyPlans.update(task.id, { status: newStatus })
          }
          
          // 状态更新后，重新拉取所有数据以刷新页面显示
          await fetchTasks()
      } catch (e) {
          console.error('切换完成状态失败', e)
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