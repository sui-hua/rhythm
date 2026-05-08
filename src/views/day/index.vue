<!--
  ============================================
  Day 视图 - 日时间轴主页面 (views/day/index.vue)
  ============================================

  【模块职责】
  - 日视图主页面容器
  - 整合 Sidebar（侧边栏）+ Timeline（时间轴）
  - 管理移动端侧边栏显示/隐藏
  - 处理日报弹窗、任务编辑弹窗、番茄钟模态框

  【布局结构】
  - Sidebar → 左侧任务列表面板
  - Timeline → 右侧时间轴主区域
  - 移动端：侧边栏通过遮罩层实现抽屉效果

  【模态框/抽屉】
  - AddEventModal → PC 端添加/编辑任务
  - MobileAddEventDrawer → 移动端添加/编辑任务
  - MobileAddEventDrawer → 移动端添加/编辑任务
  - DailyReportModal → 日报弹窗
  - PomodoroTimerModal → 番茄钟计时器
-->
<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-primary selection:text-primary-foreground">
    <div class="flex flex-1 h-full relative overflow-hidden bg-zinc-50/50">
      <!-- 侧边栏遮罩层 - 点击关闭侧边栏 -->
      <div
        v-if="isMobile && showSidebar"
        :class="getMobileOverlayClass()"
        :style="getMobileOverlayStyle()"
        @click="showSidebar = false"
      ></div>

      <!-- Sidebar Panel -->
      <div
        v-if="isMobile"
        :class="getMobileSidebarShellClass({ show: showSidebar })"
        :style="{ width: `${MOBILE_SIDEBAR_WIDTH}px` }"
      >
        <Sidebar
          :is-mobile="true"
          :show="showSidebar"
          :is-loading="isLoading"
          @scroll-to-task="scrollToTask"
          @add-event="openAddModal"
          @edit-task="openEditModal"
          @close="showSidebar = false"
        />
      </div>

      <Sidebar
        v-else
        :class="[
          'transition-opacity duration-300 ease-in-out',
          ...getSidebarMotionClass({ isMobile, show: showSidebar, isReady })
        ]"
        :is-mobile="false"
        :show="showSidebar"
        :is-loading="isLoading"
        @scroll-to-task="scrollToTask"
        @add-event="openAddModal"
        @edit-task="openEditModal"
        @close="showSidebar = false"
      />

      <!-- Main Timeline Area -->
      <div class="relative flex flex-1 flex-col overflow-hidden">
        <Timeline
          ref="timeline"
          :class="['transition-all duration-300 ease-in-out flex-1', isReady ? 'opacity-100' : 'opacity-0']"
          :current-hour="currentHour"
          :is-loading="isLoading"
          @edit-task="openEditModal"
          @select-task="scrollToTask"
        />
      </div>

      <!-- Mobile Sidebar Toggle -->
      <button
        v-if="isMobile"
        class="fixed top-4 left-4 z-30 w-10 h-10 bg-background/80 backdrop-blur-sm border border-border/50 text-foreground rounded-full shadow-sm flex items-center justify-center transition-transform active:scale-95"
        @click="showSidebar = true"
        aria-label="打开侧边栏"
      >
        <Menu class="w-5 h-5" />
      </button>

      <!-- Mobile Add Task Button -->
      <button
        v-if="isMobile"
        class="fixed bottom-6 right-6 z-30 w-11 h-11 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
        @click="openAddModal"
        aria-label="新增任务"
      >
        <Plus class="w-5 h-5" />
      </button>



      <!-- Add/Edit Event Modal/Drawer -->
      <AddEventModal
        v-if="!isMobile"
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />

      <MobileAddEventDrawer
        v-else
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />

      <!-- Quick Add Drawer (移动端快速添加) -->
      <MobileAddEventDrawer
        v-if="isMobile"
        v-model:show="showAddModal"
        :initial-data="null"
      />

      <!-- Daily Report Modal -->
      <DailyReportModal
        :show="reportVisible"
        :stats="reportStats"
        @close="closeReport"
        @confirm="handleDailyReportConfirm"
        @confirm-carryover="handleDailyReportCarryover"
      />

      <!-- Pomodoro Timer Modal -->
      <PomodoroTimerModal />
    </div>
  </div>
</template>

<script setup>
/**
 * ============================================
 * Day 视图 - 日时间轴主页面
 * ============================================
 * 
 * @description 
 * 日视图主页面容器，整合侧边栏（任务列表）和时间轴（今日任务展示）。
 * 支持 PC 端和移动端响应式布局，移动端使用抽屉式侧边栏。
 * 
 * @feature 模态框/抽屉
 * - AddEventModal: PC 端添加/编辑任务弹窗
 * - MobileAddEventDrawer: 移动端添加/编辑任务抽屉
 * - DailyReportModal: 日报弹窗，展示当日完成统计
 * - PomodoroTimerModal: 番茄钟计时器模态框
 * 
 * @composables 使用的主要逻辑
 * - useDayNavigation: 时间轴导航、滚动、加载状态
 * - useDayModal: 添加/编辑任务弹窗状态管理
 * - useMobile: 响应式设备检测
 * - useDailyReport: 日报数据获取与展示
 * - useDayData: 日计划数据获取与任务顺延
 * - useNotifications: 浏览器通知权限与提醒
 * 
 * @stores 使用的状态库
 * - uiStore: UI 状态（导航栏显示/隐藏）
 * - dateStore: 当前日期状态，切换日期时清空通知历史
 * 
 * @layouts 布局结构
 * - PC: 左侧 Sidebar + 右侧 Timeline 全屏布局
 * - 移动端: 遮罩层 + 抽屉式 Sidebar + FAB 按钮
 * 
 * @lifecycle 组件生命周期
 * - mounted: 请求通知权限并开始监听任务提醒
 * - watch dateStore.currentDate: 切换日期时清空已通知历史
 * - beforeUnmount: 恢复导航栏显示并停止监听
 */
import { ref, defineAsyncComponent, watch, onBeforeUnmount, onMounted } from 'vue'
import { Menu, Plus } from 'lucide-vue-next'
import Sidebar from '@/views/day/components/Sidebar.vue'
import Timeline from '@/views/day/components/Timeline.vue'
import DailyReportModal from '@/views/day/components/DailyReportModal.vue'
import PomodoroTimerModal from '@/views/day/components/PomodoroTimerModal.vue'
import { useDayNavigation } from '@/views/day/composables/useDayNavigation'
import { useDayModal } from '@/views/day/composables/useDayModal'
import { useMobile } from '@/composables/useMobile'
import { useUiStore } from '@/stores/uiStore'
import { useDateStore } from '@/stores/dateStore'
import { useDailyReport } from '@/views/day/composables/useDailyReport'
import { useDayData } from '@/views/day/composables/useDayData'
import {
  getMobileOverlayClass,
  getMobileOverlayStyle,
  getMobileSidebarShellClass,
  getSidebarMotionClass,
  MOBILE_SIDEBAR_WIDTH
} from '@/views/day/composables/mobileLayers'
import { useNotifications } from '@/composables/useNotifications'

const AddEventModal = defineAsyncComponent(() => import('@/views/day/components/AddEventModal.vue'))
const MobileAddEventDrawer = defineAsyncComponent(() => import('@/views/day/components/MobileAddEventDrawer.vue'))

const { isReady, isLoading, scrollToTask, currentHour } = useDayNavigation()
const { showAddModal, editingTask, openAddModal, openEditModal } = useDayModal()
const { isMobile } = useMobile()
const uiStore = useUiStore()
const dateStore = useDateStore()

const { reportVisible, reportStats, closeReport } = useDailyReport()
const { dailySchedule, carryOverUncompletedTasksTo, fetchTasks, setLoading } = useDayData()
const { startListening, stopListening, clearNotifiedHistory, requestPermission } = useNotifications()

onMounted(async () => {
  await requestPermission()
  startListening(() => dailySchedule.value)
})

watch(() => dateStore.currentDate, () => {
  clearNotifiedHistory()
})

const showSidebar = ref(false)
watch([showSidebar, isMobile], ([open, mobile]) => {
  uiStore.setNavbarHidden(Boolean(mobile && open))
})

onBeforeUnmount(() => {
  uiStore.setNavbarHidden(false)
  stopListening()
})

const handleDailyReportConfirm = async () => {
  await closeReport()
}

const handleDailyReportCarryover = async () => {
  try {
    setLoading(true)
    await carryOverUncompletedTasksTo(new Date())
    await fetchTasks({ showLoading: false })
    await closeReport()
  } catch (e) {
    console.error('顺延任务失败:', e)
  } finally {
    setLoading(false)
  }
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>

<!--
 * ============================================
 * DayDesktopPage - 日时间轴主页面
 * ============================================
 *
 * @description
 * 日视图主页面容器组件，整合侧边栏（任务列表）和时间轴（今日任务展示）。
 * 支持 PC 端和移动端响应式布局：
 *   - PC 端：固定左侧 Sidebar + 右侧 Timeline 全屏布局
 *   - 移动端：抽屉式 Sidebar + FAB 按钮触发添加
 *
 * @路由 /day/:year/:month/:day
 * @对应组件 src/views/day/index.vue
 *
 * @composables 核心业务逻辑
 * - useDayNavigation: 时间轴导航、滚动位置、当前小时、加载状态
 * - useDayModal: 添加/编辑任务弹窗状态管理
 * - useMobile: 响应式设备检测（isMobile）
 * - useDailyReport: 日报数据获取与展示
 * - useDayData: 日计划数据获取与任务顺延
 * - useNotifications: 浏览器通知权限与任务提醒
 *
 * @stores 状态管理
 * - uiStore: UI 状态（导航栏显示/隐藏控制）
 * - dateStore: 当前日期状态，切换日期时清空通知历史
 *
 * @components 子组件
 * - Sidebar: 左侧任务列表面板
 * - Timeline: 右侧时间轴主区域
 * - AddEventModal: PC 端添加/编辑任务弹窗（异步加载）
 * - MobileAddEventDrawer: 移动端添加/编辑任务抽屉（异步加载）
 * - DailyReportModal: 日报弹窗，展示当日完成统计
 * - PomodoroTimerModal: 番茄钟计时器模态框
 *
 * @lifecycle 生命周期
 * - onMounted: 请求通知权限并开始监听任务提醒
 * - watch dateStore.currentDate: 切换日期时清空已通知历史
 * - beforeUnmount: 恢复导航栏显示并停止监听
 *
 * @布局结构
 *   ┌──────────────────────────────────────────┐
 *   │ Sidebar │        Timeline                │
 *   │ (任务列表) │    (时间轴主区域)            │
 *   │          │                               │
 *   └──────────────────────────────────────────┘
 -->
