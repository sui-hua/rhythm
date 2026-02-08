<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    <YearGrid
      :year-data="yearData"
      @enter-month="enterMonth"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import YearGrid from './components/YearGrid.vue'
import { mockDb } from '@/services/mockDb'

const router = useRouter()

// 年数据逻辑
const yearData = computed(() => {
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  
  // Aggregate all completed days from all habits to show overall activity
  const allCompletedDays = new Set()
  mockDb.habits.value.forEach(habit => {
    habit.completedDays.forEach(day => allCompletedDays.add(day))
  })

  return months.map((name, index) => {
    const daysInMonth = new Date(2026, index + 1, 0).getDate()
    return {
      name,
      days: daysInMonth,
      firstDayOffset: (new Date(2026, index, 1).getDay() + 6) % 7,
      index,
      // For now, simplify: we only show completions in JAN (index 0) from mock habits
      completedDays: index === 0 ? Array.from(allCompletedDays) : []
    }
  })
})

// 进入月份视图
const enterMonth = (month) => {
  router.push(`/month/${month.index}`)
}
</script>