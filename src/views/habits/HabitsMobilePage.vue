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

  【数据流】
  - useHabitData: 提供习惯列表、选中习惯、月份切换等核心数据
  - useHabitStats: 计算今日完成率、习惯统计信息
  - useHabitLogs: 处理打卡操作和快速日志记录
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
/**
 * ============================================
 * HabitsMobilePage - 习惯模块移动端主页面
 * ============================================
 *
 * 【页面职责】
 * 移动端习惯追踪的入口页面，采用"主内容优先 + 底部抽屉"的布局模式。
 * 用户可以在主区域查看习惯详情、打卡日历、统计数据和日志，
 * 通过底部抽屉切换或管理习惯。
 *
 * 【核心数据结构】
 * - habits: 习惯列表（未归档）
 * - archivedHabits: 已归档习惯列表
 * - selectedHabit: 当前选中的习惯（显示在主区域）
 * - viewYear/viewMonth: 当前查看的年月（用于日历组件）
 *
 * 【弹窗状态】
 * - showAddModal: 新增习惯弹窗
 * - showEditModal: 编辑习惯弹窗
 * - showHabitSheet: 底部习惯列表抽屉
 *
 * 【页面生命周期】
 * 1. onMounted → fetchHabits() 初始化加载习惯列表
 * 2. watch selectedHabit → 自动加载选中习惯的日志
 *
 * 【主要交互流程】
 * - 点击右下角添加按钮 → 无习惯时直接打开添加弹窗，有习惯时打开底部抽屉
 * - 点击底部抽屉中的习惯 → 选中并显示在主区域
 * - 日历组件 toggle-complete → 今日打卡/取消打卡
 * - 今日卡片 quick-log → 快速记录文字日志
 *
 * 【与 PC 端差异】
 * - PC 端侧边栏常驻，移动端改为底部抽屉（HabitMobileListSheet）
 * - 移动端有独立的添加按钮（mobile-add-button）
 * - 触摸友好的 UI 交互（手势滑动打开/关闭抽屉）
 */
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

/**
 * ============================================
 * 第一层：useHabitData - 核心数据层
 * ============================================
 * 提供习惯管理的核心数据：
 * - habits / archivedHabits: 习惯列表
 * - selectedHabit: 当前选中习惯（响应式 ref）
 * - viewYear / viewMonth: 当前查看的年月
 * - fetchHabits(): 加载习惯列表
 * - fetchLogsForHabit(): 加载指定习惯的日志
 * - handleMonthChange(): 切换月份（由日历组件触发）
 * - isPageLoading: 页面加载状态
 */
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

/**
 * ============================================
 * 第二层：useHabitStats - 统计计算层
 * ============================================
 * 基于 habits 和 selectedHabit 计算统计信息：
 * - todayCompletionRate: 今日完成率（已打卡数/总习惯数）
 * - habitStats: 当前选中习惯的统计数据（连续打卡天数、完成率等）
 */
const {
  todayCompletionRate,
  habitStats
} = useHabitStats(habits, selectedHabit)

/**
 * ============================================
 * 第三层：useHabitLogs - 操作执行层
 * ============================================
 * 处理用户操作：
 * - toggleComplete(): 今日打卡/取消打卡
 * - performQuickLog(): 记录文字日志（快捷打卡）
 * 注意：实际执行逻辑由 composable 内部处理
 */
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

// ============================================
// 页面自身专有的局部状态和操控方法
// ============================================
// 注意：以下状态和方法属于页面组件自身，不涉及核心业务逻辑

/**
 * 弹窗显示状态
 * - showAddModal: 新增习惯弹窗
 * - showEditModal: 编辑习惯弹窗
 * - showHabitSheet: 底部习惯列表抽屉
 */
const showAddModal = ref(false)
const showEditModal = ref(false)
const showHabitSheet = ref(false)

/**
 * 选中习惯处理
 * 从底部抽屉中选择一个习惯后：
 * 1. 更新 selectedHabit 响应式引用
 * 2. 关闭底部抽屉
 * @param {Object} habit - 选中的习惯对象
 */
const handleSelectHabit = (habit) => {
  selectedHabit.value = habit
  showHabitSheet.value = false
}

/**
 * 编辑习惯处理
 * 打开编辑弹窗前先设置待编辑的习惯：
 * 1. 保存 selectedHabit 引用
 * 2. 打开编辑弹窗
 * @param {Object} habit - 待编辑的习惯对象
 */
const handleEditHabit = (habit) => {
  selectedHabit.value = habit
  showEditModal.value = true
}

/**
 * 右下角添加按钮点击处理
 * 智能判断逻辑：
 * - 若无习惯列表，直接打开添加弹窗
 * - 若有习惯列表，打开底部抽屉（让用户选择后再添加）
 */
const handleAddClick = () => {
  if (habits.value && habits.value.length > 0) {
    showHabitSheet.value = true
  } else {
    showAddModal.value = true
  }
}

/**
 * 获取当前日期字符串
 * 格式：M月D日（如"4月20日"）
 * 用于显示在 HabitTodayCard 组件中
 * @returns {string} 格式化后的日期字符串
 */
const getCurrentDate = () => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
}

/**
 * 快速日志处理
 * 将子组件（HabitTodayCard）传递的文本日志
 * 转发给 useHabitLogs 的 performQuickLog 方法执行
 * @param {string} note - 用户输入的日志文本
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
