<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">

    <HabitSidebar
      :habits="habits"
      :archived-habits="archivedHabits"
      :selected-habit-id="selectedHabit?.id"
      :today-completion-rate="todayCompletionRate"
      @select-habit="selectedHabit = $event"
      @edit-habit="handleSidebarEdit"
      @add-habit="showAddModal = true"
    />

    <div class="flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col">
      <div v-if="selectedHabit" class="w-full h-full flex flex-col p-6 md:p-10 overflow-auto relative z-10 no-scrollbar">

        <div class="max-w-4xl mx-auto w-full flex flex-col gap-6">
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
    </div>

    <AddHabitModal
      v-model:show="showAddModal"
      @refresh="fetchHabits"
    />

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
 * 习惯页面级主视图组件 (habits/index.vue)
 * 编排并整合习惯列表侧边栏、中心动态看板、各项统计以及编辑/新建弹窗模块。
 * 数据源由底部抽离出的多个 hooks 提供支持。
 */
import { ref, onMounted, defineAsyncComponent } from 'vue'
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

// 1. 获取核心数据层面能力支撑
const {
  habits,
  archivedHabits,
  selectedHabit,
  viewYear,
  viewMonth,
  handleMonthChange,
  fetchHabits
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

// --- 页面 UI 自身专有的局部状态和操控方法 ---

const showAddModal = ref(false) // 开启和关闭新建习惯弹窗状态位
const showEditModal = ref(false) // 开启和关闭编辑习惯弹窗状态位

/**
 * 响应来自左侧边栏触发的编辑命令 (例如鼠标双击)
 * 装载对应数据后拉起更改弹窗。
 */
const handleSidebarEdit = (habit) => {
  selectedHabit.value = habit
  showEditModal.value = true
}

/**
 * 简易日期格式化工具方法
 * 返回纯展示用的类似于 `3月1日` 中文日期字符串
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
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>
