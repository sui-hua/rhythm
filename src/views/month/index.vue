<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    <div class="fixed inset-0 z-[90] h-full w-full bg-white flex flex-col">
      <MonthGrid
        :month-grid-data="monthGridData"
        @enter-day="enterDay"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MonthHeader from './components/MonthHeader.vue'
import MonthGrid from './components/MonthGrid.vue'
import { db } from '@/services/database'

const router = useRouter()
const route = useRoute()

// 月份数据
const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

// 当前选中的月份
const selectedMonth = computed(() => {
  const monthIndex = parseInt(route.params.monthIndex) - 1
  const daysInMonth = new Date(2026, monthIndex + 1, 0).getDate()
  return {
    name: months[monthIndex],
    days: daysInMonth,
    firstDayOffset: (new Date(2026, monthIndex, 1).getDay() + 6) % 7,
    index: monthIndex
  }
})

const tasks = ref([])

const fetchMonthTasks = async () => {
  const monthIndex = parseInt(route.params.monthIndex) - 1
  if (isNaN(monthIndex)) return
  
  const year = 2026
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59)
  
  try {
    tasks.value = await db.tasks.list(start, end)
  } catch(e) { console.error(e) }
}

onMounted(fetchMonthTasks)
watch(() => route.params.monthIndex, fetchMonthTasks)

// 月数据逻辑
const monthGridData = computed(() => {
  const grid = []
  const { index, days, firstDayOffset } = selectedMonth.value
  const prevMonthLastDay = new Date(2026, index, 0).getDate()
  // 填充上月日期
  for (let i = firstDayOffset - 1; i >= 0; i--) grid.push({ date: prevMonthLastDay - i, isCurrent: false })
  // 填充本月日期
  for (let i = 1; i <= days; i++) {
    const dayTasks = tasks.value.filter(t => {
        const d = new Date(t.start_time)
        return d.getDate() === i && d.getMonth() === index && d.getFullYear() === 2026
    })
    
    // Parse task hours for the grid indicator
    const taskHours = dayTasks.flatMap(task => {
        const dStart = new Date(task.start_time)
        const dEnd = new Date(task.end_time)
        const start = dStart.getHours() + dStart.getMinutes() / 60
        const end = dEnd.getHours() + dEnd.getMinutes() / 60
        // Return 1-hour segments for visual markers in the grid
        const hours = []
        for (let h = Math.floor(start); h < Math.ceil(end); h++) {
            hours.push(h)
        }
        return hours
    })

    grid.push({
      date: i,
      isCurrent: true,
      tasks: dayTasks.map(t => t.id),
      taskHours
    })
  }
  // 补齐 42 个单元格
  while (grid.length < 42) grid.push({ date: grid.length - days - firstDayOffset + 1, isCurrent: false })
  return grid
})

// 返回年视图
const goBackToYear = () => {
  router.push('/year')
}

// 进入日视图
const enterDay = (date) => {
  router.push(`/day/${selectedMonth.value.index + 1}/${date}`)
}

// 确保参数有效
onMounted(() => {
  const monthIndex = parseInt(route.params.monthIndex)
  if (isNaN(monthIndex) || monthIndex < 1 || monthIndex > 12) {
    router.push('/year')
  }
})
</script>