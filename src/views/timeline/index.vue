<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    <!-- 统一的视图转场容器 -->
    <Transition :name="transitionName" mode="out-in">
      <!-- 动态组件渲染 -->
      <YearView 
        v-if="viewMode === 'year'" 
        :year-data="yearData"
        @enter-month="enterMonth"
      />
      
      <MonthView 
        v-else-if="viewMode === 'month'" 
        :selected-month="selectedMonth"
        @back-to-year="viewMode = 'year'"
        @enter-day="enterDay"
      />
      
      <DayView 
        v-else-if="viewMode === 'day'" 
        :selected-day="selectedDay"
        :selected-month="selectedMonth"
        :daily-schedule="dailySchedule"
        :current-hour="currentHour"
        @back-to-month="goBackToMonth"
      />
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import YearView from '../year/index.vue'
import MonthView from '../month/index.vue'
import DayView from '../day/index.vue'

// 视图控制
const viewMode = ref('day') // year, month, day
const selectedMonth = ref({ name: 'JANUARY', index: 0, days: 31, firstDayOffset: 6 })
const selectedDay = ref(19)
const currentHour = ref(12.2) // 模拟当前时间位置

// 日日程数据
const dailySchedule = ref([
  { startHour: 9, durationHours: 2, time: '09:00', duration: '2.0H', category: 'Creative', title: 'Spatial Interface', description: 'Deep dive into the architecture of non-linear time navigation and visual metaphors.', completed: false },
  { startHour: 13, durationHours: 1.5, time: '13:00', duration: '1.5H', category: 'Design', title: 'Visual Polish', description: 'Critique of the kinetic motion curves and typographic weighting across mobile viewpoints.', completed: true },
  { startHour: 16, durationHours: 2.5, time: '16:00', duration: '2.5H', category: 'Engineering', title: 'System Audit', description: 'Optimizing the rendering pipeline for 120fps fluid transitions between view layers.', completed: false }
])

// 年数据逻辑
const yearData = computed(() => {
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  return months.map((name, index) => {
    const daysInMonth = new Date(2026, index + 1, 0).getDate()
    return {
      name,
      days: daysInMonth,
      firstDayOffset: (new Date(2026, index, 1).getDay() + 6) % 7,
      index,
      completedDays: [5, 12, 19]
    }
  })
})

// 根据视图模式选择过渡效果
const transitionName = computed(() => {
  return viewMode.value === 'day' ? 'view-slide' : 'view-fade'
})

// 交互逻辑
const enterMonth = (month) => {
  selectedMonth.value = month
  viewMode.value = 'month'
}

const enterDay = (date) => {
  selectedDay.value = date
  viewMode.value = 'day'
}

const goBackToMonth = () => {
  viewMode.value = 'month'
}

// 动态时间线更新模拟
onMounted(() => {
  // 更新当前时间
  setInterval(() => {
    const now = new Date();
    currentHour.value = now.getHours() + now.getMinutes() / 60;
  }, 60000);
})
</script>

<style scoped>
/* 视图转场动画 */
.view-fade-enter-active, .view-fade-leave-active {
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.view-fade-enter-from, .view-fade-leave-to {
  opacity: 0;
  filter: blur(20px);
}

.view-slide-enter-active, .view-slide-leave-active {
  transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}
.view-slide-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.view-slide-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

/* 通用样式 */
.grid-rows-6 {
  grid-template-rows: repeat(6, minmax(0, 1fr));
}

/* 深度排版优化 */
h3, h4 {
  letter-spacing: -0.05em;
}

/* 隐藏滚动条 */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>