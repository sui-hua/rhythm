<!--
  ============================================
  Habits 桌面端页面 (HabitsDesktopPage.vue)
  ============================================

  【模块职责】
  - 桌面端布局：三栏结构
  - HabitSidebar → 左侧习惯列表导航
  - 右侧主内容区 → HabitHeader + HabitStats + HabitCalendar + HabitTodayCard + HabitLogs

  【弹窗】
  - AddHabitModal → 添加新习惯
  - EditHabitModal → 编辑习惯
-->
<template>
  <div class="habits-desktop-root">
    <!-- 左侧导航：习惯列表 -->
    <HabitSidebar
      :habits="habits"
      :archived-habits="archivedHabits"
      :selected-habit-id="selectedHabit?.id"
      :today-completion-rate="todayCompletionRate"
      @select-habit="selectedHabit = $event"
      @edit-habit="handleSidebarEdit"
      @add-habit="showAddModal = true"
    />

    <div class="habits-desktop-main">
      <!-- 页面级骨架 -->
      <div v-if="isPageLoading" class="habits-desktop-skeleton">
        <div class="skeleton-sidebar">
          <div class="skeleton-line w-3/4 h-4 rounded-md" />
          <div class="skeleton-line w-1/2 h-3 rounded-md mt-2" />
          <div class="skeleton-line w-2/3 h-4 rounded-md mt-4" />
          <div class="skeleton-line w-1/2 h-3 rounded-md mt-2" />
        </div>
        <div class="skeleton-content">
          <div class="skeleton-block h-8 w-48 rounded-lg mb-6" />
          <div class="skeleton-block h-24 w-full rounded-lg mb-6" />
          <div class="skeleton-block h-64 w-full rounded-lg mb-6" />
          <div class="skeleton-block h-32 w-full rounded-lg" />
        </div>
      </div>
      <div v-else-if="selectedHabit" class="habits-desktop-content">
        <ScrollArea class="habits-scroll">
          <div class="max-w-4xl mx-auto w-full flex flex-col gap-6 p-6 md:p-10">
            <PageIntroBanner
              eyebrow="周期节律"
              :title="narrative.title"
              :subtitle="narrative.subtitle"
            />

            <HabitHeader :title="selectedHabit.title" />

            <HabitStats :stats="habitStats" />

            <HabitCalendar
              :completed-days="selectedHabit.completedDays"
              @toggle-complete="toggleComplete"
              @month-changed="handleMonthChange"
            />

            <HabitTodayCard
              :current-date="getCurrentDate()"
              @quick-log="handleQuickLog"
            />

            <HabitLogs :logs="selectedHabit?.logs || []" />
          </div>
        </ScrollArea>
      </div>
      <div v-else class="habits-empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg class="w-16 h-16 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="empty-text">从左侧选择或创建一个习惯开始追踪</p>
          <Button @click="showAddModal = true">
            <Plus class="w-4 h-4 mr-2" />
            添加习惯
          </Button>
        </div>
      </div>
    </div>

    <!-- 弹窗：添加新习惯 -->
    <AddHabitModal
      v-model:show="showAddModal"
      @refresh="fetchHabits"
    />

    <!-- 弹窗：编辑习惯 -->
    <EditHabitModal
      v-model:show="showEditModal"
      :habit-data="selectedHabit"
      @refresh="fetchHabits"
      @deleted="selectedHabit = null"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, defineAsyncComponent } from 'vue'
import { Plus } from 'lucide-vue-next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import HabitSidebar from './components/HabitSidebar.vue'
import HabitHeader from './components/HabitHeader.vue'
import HabitStats from './components/HabitStats.vue'
import HabitCalendar from './components/HabitCalendar.vue'
import HabitTodayCard from './components/HabitTodayCard.vue'
import HabitLogs from './components/HabitLogs.vue'

// 弹窗组件按需加载
const AddHabitModal = defineAsyncComponent(() => import('./components/AddHabitModal.vue'))
const EditHabitModal = defineAsyncComponent(() => import('./components/EditHabitModal.vue'))

import { useHabitData } from './composables/useHabitData'
import { useHabitStats } from './composables/useHabitStats'
import { useHabitLogs } from './composables/useHabitLogs'
import PageIntroBanner from '@/components/PageIntroBanner.vue'
import { getPageNarrative } from '@/config/pageNarratives'

const narrative = getPageNarrative('habits')

// 1. 获取核心数据层面能力支撑
const {
  habits,
  archivedHabits,
  selectedHabit,
  viewYear,
  viewMonth,
  handleMonthChange,
  fetchHabits,
  fetchLogsForHabit,
  isPageLoading
} = useHabitData()

// 2. 统计计算层面能力支撑
const {
  todayCompletionRate,
  habitStats
} = useHabitStats(habits, selectedHabit)

// 3. 执行打卡和简易文字日志的支撑
const {
  toggleComplete,
  handleQuickLog: performQuickLog
} = useHabitLogs(selectedHabit, viewYear, viewMonth, fetchHabits)

// 控制首屏立刻请求初始化拉取数据列表
onMounted(fetchHabits)

// 监听选中习惯的变化，加载对应日志
watch(selectedHabit, (newHabit) => {
  if (newHabit) {
    fetchLogsForHabit(newHabit.id)
  }
}, { immediate: true })

// --- 页面 UI 自身专有的局部状态和操控方法 ---

const showAddModal = ref(false)
const showEditModal = ref(false)

/**
 * 响应来自左侧边栏触发的编辑命令
 */
const handleSidebarEdit = (habit) => {
  selectedHabit.value = habit
  showEditModal.value = true
}

/**
 * 简易日期格式化工具方法
 */
const getCurrentDate = () => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
}

/**
 * 将绑定的文本传递给底层的日志创建 hook，执行打卡后清空文字框本身。
 */
const handleQuickLog = async (note) => {
  await performQuickLog(note)
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.no-scrollbar::-webkit-scrollbar { display: none; }
.habits-desktop-root {
  @apply h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative;
}

.habits-desktop-main {
  @apply flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col;
}

.habits-desktop-content {
  @apply w-full h-full overflow-auto relative z-10;
}

.habits-scroll {
  @apply w-full h-full;
}

.habits-desktop-skeleton {
  @apply w-full h-full flex p-0 overflow-auto relative z-10;
}

.skeleton-sidebar {
  @apply w-[280px] border-r border-border bg-white p-6 flex flex-col;
}

.skeleton-content {
  @apply flex-1 p-6;
}

.skeleton-line, .skeleton-block {
  @apply bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-md;
}

.skeleton-block {
  @apply bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg;
}

.habits-empty-state {
  @apply flex-1 flex items-center justify-center;
}

.empty-content {
  @apply flex flex-col items-center gap-4 text-center p-8;
}

.empty-icon {
  @apply mb-2;
}

.empty-text {
  @apply text-muted-foreground text-sm;
}
</style>
