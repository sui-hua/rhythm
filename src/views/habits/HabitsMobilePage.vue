<!--
  ============================================
  Habits 移动端页面 (HabitsMobilePage.vue)
  ============================================

  【模块职责】
  - 移动端布局：主内容优先，习惯列表在底部抽屉
  - 主内容区 → HabitHeader + HabitStats + HabitCalendar + HabitTodayCard + HabitLogs
  - HabitMobileListSheet → 底部习惯选择抽屉

  【移动端特性】
  - 主内容优先展示
  - 底部抽屉包含：习惯列表（HabitSidebar 内容）
  - 支持触摸手势滑动打开/关闭抽屉
-->
<template>
  <div class="habits-mobile-root">
    <!-- 遮罩层 -->
    <div
      v-if="showHabitSheet"
      class="mobile-overlay"
      @click="showHabitSheet = false"
    ></div>

    <!-- 主内容区域 -->
    <div class="mobile-content">
      <div v-if="isPageLoading" class="mobile-skeleton">
        <div class="skeleton-block h-8 w-32 rounded-lg mb-6" />
        <div class="skeleton-block h-24 w-full rounded-lg mb-6" />
        <div class="skeleton-block h-48 w-full rounded-lg mb-6" />
        <div class="skeleton-block h-32 w-full rounded-lg" />
      </div>
      <template v-else-if="selectedHabit">
        <div class="mobile-scroll">
          <div class="max-w-4xl mx-auto w-full flex flex-col gap-6 p-6">
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
        </div>
      </template>
      <div v-else class="habits-empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <svg class="w-16 h-16 text-zinc-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p class="empty-text">点击下方按钮选择或创建习惯</p>
          <Button @click="showAddModal = true">
            <Plus class="w-4 h-4 mr-2" />
            添加习惯
          </Button>
        </div>
      </div>
    </div>

    <!-- 底部习惯列表抽屉 -->
    <HabitMobileListSheet
      v-model:show="showHabitSheet"
      :habits="habits"
      :archived-habits="archivedHabits"
      :selected-habit-id="selectedHabit?.id"
      :today-completion-rate="todayCompletionRate"
      :is-loading="isPageLoading"
      @select-habit="handleSelectHabit"
      @edit-habit="handleEditHabit"
      @add-habit="showAddModal = true"
    />

    <!-- 移动端添加按钮 -->
    <Button
      class="mobile-add-button"
      @click="handleAddClick"
    >
      <Plus class="w-4 h-4" />
    </Button>

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
import { Button } from '@/components/ui/button'
import HabitHeader from './components/HabitHeader.vue'
import HabitStats from './components/HabitStats.vue'
import HabitCalendar from './components/HabitCalendar.vue'
import HabitTodayCard from './components/HabitTodayCard.vue'
import HabitLogs from './components/HabitLogs.vue'
import HabitMobileListSheet from './HabitMobileListSheet.vue'

// 弹窗组件按需加载
const AddHabitModal = defineAsyncComponent(() => import('./components/AddHabitModal.vue'))
const EditHabitModal = defineAsyncComponent(() => import('./components/EditHabitModal.vue'))

import { useHabitData } from './composables/useHabitData'
import { useHabitStats } from './composables/useHabitStats'
import { useHabitLogs } from './composables/useHabitLogs'

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
const showHabitSheet = ref(false)

const handleSelectHabit = (habit) => {
  selectedHabit.value = habit
  showHabitSheet.value = false
}

const handleEditHabit = (habit) => {
  selectedHabit.value = habit
  showEditModal.value = true
}

const handleAddClick = () => {
  if (habits.value && habits.value.length > 0) {
    showHabitSheet.value = true
  } else {
    showAddModal.value = true
  }
}

/**
 * 简易日期格式化工具方法
 */
const getCurrentDate = () => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
}

/**
 * 将绑定的文本传递给底层的日志创建 hook
 */
const handleQuickLog = async (note) => {
  await performQuickLog(note)
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.habits-mobile-root {
  @apply h-screen w-full bg-white flex flex-col overflow-hidden font-sans text-black selection:bg-black selection:text-white relative;
}

.mobile-overlay {
  @apply fixed inset-0 z-[40] bg-black/40 backdrop-blur-[2px];
}

.mobile-content {
  @apply flex-1 overflow-y-auto pb-24;
}

.mobile-scroll {
  @apply w-full;
}

.mobile-skeleton {
  @apply p-6;
}

.skeleton-block {
  @apply bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg;
}

.mobile-add-button {
  @apply fixed bottom-24 right-6 z-30 w-11 h-11 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95;
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
