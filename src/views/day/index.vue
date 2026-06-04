<template>
  <!--
    Day 页面 — 每日时间轴视图，聚合任务、日计划和习惯数据
    主要结构：侧边栏、时间轴、添加事件弹窗、日报弹窗、番茄钟弹窗
  -->
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-primary selection:text-primary-foreground">
    <div class="flex flex-1 h-full relative overflow-hidden bg-zinc-50/50">
      <!-- 侧边栏：任务列表和快捷操作 -->
      <Sidebar
        :is-loading="isLoading"
        @scroll-to-task="scrollToTask"
        @add-event="openAddModal"
        @edit-task="openEditModal"
      />

      <!-- 时间轴主区域 -->
      <div class="relative flex-1 flex flex-col overflow-hidden">
        <Timeline
          ref="timeline"
          :class="['transition-all duration-300 ease-in-out flex-1', isReady ? 'opacity-100' : 'opacity-0']"
          :current-hour="currentHour"
          :is-loading="isLoading"
          @edit-task="openEditModal"
          @select-task="scrollToTask"
        />
      </div>

      <!-- 添加/编辑事件弹窗 -->
      <AddEventModal
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />

      <!-- 日报弹窗：任务完成统计和顺延 -->
      <DailyReportModal
        :show="reportVisible"
        :stats="reportStats"
        @close="closeReport"
        @confirm="handleDailyReportConfirm"
        @confirm-carryover="handleDailyReportCarryover"
      />

      <!-- 番茄钟弹窗 -->
      <PomodoroTimerModal />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Day 页面脚本
 * 职责：协调侧边栏、时间轴、弹窗的交互逻辑，管理日程通知
 * 数据流：dateStore.currentDate → dayStore → Timeline/Sidebar → 用户交互
 */

// ── 依赖导入 ──
import { defineAsyncComponent, watch, onBeforeUnmount, onMounted } from 'vue'
import Sidebar from '@/views/day/components/Sidebar.vue'
import Timeline from '@/views/day/components/Timeline.vue'
import DailyReportModal from '@/views/day/components/DailyReportModal.vue'
import PomodoroTimerModal from '@/views/day/components/PomodoroTimerModal.vue'
import { useDayNavigation } from '@/views/day/composables/useDayNavigation'
import { useDayModal } from '@/views/day/composables/useDayModal'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { useDayStore } from '@/stores/dayStore'
import { useNotifications } from '@/composables/useNotifications'

// 异步加载 AddEventModal，减少首屏包体积
const AddEventModal = defineAsyncComponent(() => import('@/views/day/components/AddEventModal.vue'))

// ── Composables ──
// 时间轴导航：滚动定位、加载状态、当前小时
const { isReady, isLoading, scrollToTask, currentHour } = useDayNavigation()
// 弹窗控制：添加/编辑事件的显示状态和数据
const { showAddModal, editingTask, openAddModal, openEditModal } = useDayModal()
const dateStore = useDateStore()

// 日报弹窗：统计数据和显隐控制
const { reportVisible, reportStats, closeReport } = useDailyReport()
const dayStore = useDayStore()
// 日程通知：监听、停止、清除已通知历史、请求权限
const { startListening, stopListening, clearNotifiedHistory, requestPermission } = useNotifications()

// ── 生命周期 ──
// 页面挂载后请求通知权限并启动日程监听
onMounted(async () => {
  await requestPermission()
  startListening(() => dayStore.dailySchedule as any)
})

// 日期切换时清除已通知历史，避免跨日期重复通知
watch(() => dateStore.currentDate, () => {
  clearNotifiedHistory()
})

// 页面卸载时停止通知监听，防止内存泄漏
onBeforeUnmount(() => {
  stopListening()
})

// ── 方法 ──
// 确认日报：关闭弹窗
const handleDailyReportConfirm = async () => {
  await closeReport()
}

// 顺延未完成任务到今天：先锁定加载状态，顺延完成后刷新任务列表，最后关闭弹窗
const handleDailyReportCarryover = async () => {
  try {
    dayStore.setLoading(true)
    await dayStore.carryOverUncompletedTasksTo(new Date())
    await dayStore.fetchTasks({ showLoading: false })
    await closeReport()
  } catch (e) {
    console.error('顺延任务失败:', e)
  } finally {
    // 无论成功失败都要释放加载状态，避免界面卡死
    dayStore.setLoading(false)
  }
}
</script>

<style scoped>
</style>
