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
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MonthHeader from './components/MonthHeader.vue'
import MonthGrid from './components/MonthGrid.vue'
import { mockDb } from '@/services/mockDb'

const router = useRouter()
const route = useRoute()

// 月份数据
const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']

// 当前选中的月份
const selectedMonth = computed(() => {
  const monthIndex = parseInt(route.params.monthIndex)
  const daysInMonth = new Date(2026, monthIndex + 1, 0).getDate()
  return {
    name: months[monthIndex],
    days: daysInMonth,
    firstDayOffset: (new Date(2026, monthIndex, 1).getDay() + 6) % 7,
    index: monthIndex
  }
})

// 月数据逻辑
const monthGridData = computed(() => {
  const grid = []
  const { index, days, firstDayOffset } = selectedMonth.value
  const prevMonthLastDay = new Date(2026, index, 0).getDate()
  // 填充上月日期
  for (let i = firstDayOffset - 1; i >= 0; i--) grid.push({ date: prevMonthLastDay - i, isCurrent: false })
  // 填充本月日期
  for (let i = 1; i <= days; i++) {
    const dateStr = `2026-${String(index + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const dayTasks = mockDb.tasks.value.filter(t => t.date === dateStr)
    
    // Parse task hours for the grid indicator
    const taskHours = dayTasks.flatMap(task => {
        const [sH, sM] = task.start_time.split(':').map(Number)
        const [eH, eM] = task.end_time.split(':').map(Number)
        const start = sH + sM / 60
        const end = eH + eM / 60
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
  router.push(`/day/${selectedMonth.value.index}/${date}`)
}

// 确保参数有效
onMounted(() => {
  const monthIndex = parseInt(route.params.monthIndex)
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex >= months.length) {
    router.push('/year')
  }
})
</script>