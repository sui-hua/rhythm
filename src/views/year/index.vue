<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    <YearGrid
      :year-data="yearData"
      @enter-month="enterMonth"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import YearGrid from './components/YearGrid.vue'
import { db } from '@/services/database'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'

const dateStore = useDateStore()
const router = useRouter()
const habits = ref([])

onMounted(async () => {
  try {
    habits.value = await db.habits.list()
  } catch (e) { console.error(e) }
})

// 年数据逻辑
const yearData = computed(() => {
  
  const currentYear = dateStore.currentDate.getFullYear()
  
  // Aggregate all completed days from all habits by month
  const completedByMonth = new Map()
  
  habits.value.forEach(habit => {
    const logs = habit.habit_logs || []
    logs.forEach(log => {
      const d = new Date(log.completed_at)
      if (d.getFullYear() === currentYear) {
        const m = d.getMonth()
        const day = d.getDate()
        if (!completedByMonth.has(m)) completedByMonth.set(m, new Set())
        completedByMonth.get(m).add(day)
      }
    })
  })

  const result = []
  for (let m = 1; m <= 12; m++) {
    const index = m - 1
    const name = getMonthName(m, 'en')
    const daysInMonth = new Date(currentYear, m, 0).getDate()
    result.push({
      name,
      days: daysInMonth,
      firstDayOffset: (new Date(currentYear, index, 1).getDay() + 6) % 7,
      index,
      completedDays: completedByMonth.has(index) ? Array.from(completedByMonth.get(index)) : []
    })
  }
  return result
})

// 进入月份视图
const enterMonth = (month) => {
  router.push(`/month/${month.index + 1}`)
}
</script>