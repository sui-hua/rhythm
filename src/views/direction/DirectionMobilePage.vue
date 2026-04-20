<!--
  ============================================
  Direction 移动端页面 (DirectionMobilePage.vue)
  ============================================

  【模块职责】
  - 移动端布局：主内容优先，GoalSheet 底部抽屉
  - MissionBoard → 主内容区域
  - DirectionMobileGoalSheet → 底部目标选择抽屉

  【移动端特性】
  - 主内容优先展示（MissionBoard）
  - 底部抽屉包含：GoalRangePicker + DirectionSidebar 目标列表 + MissionArchive
  - 支持触摸手势滑动打开/关闭抽屉
-->
<template>
  <div class="mobile-root">
    <!-- 遮罩层：当底部抽屉打开时显示半透明黑色遮罩，点击可关闭抽屉 -->
    <div
      v-if="showGoalSheet"
      class="mobile-overlay"
      @click="showGoalSheet = false"
    ></div>

    <!-- 主内容区域：MissionBoard -->
    <div class="mobile-content">
      <!-- 页面加载骨架屏：数据加载期间显示占位动画，提升感知加载速度 -->
      <div v-if="isPageLoading" class="mobile-skeleton">
        <div class="skeleton-block h-12 rounded-lg mb-4" />
        <div class="skeleton-block h-48 rounded-lg" />
      </div>
      <!-- 实际内容：目标月份范围选择器 + 月度任务面板 -->
      <template v-else>
        <!-- 目标月份范围选择器：切换查看不同月份的任务数据 -->
        <GoalRangePicker />
        <!-- 月度任务面板：展示当月每日任务完成情况的核心区域 -->
        <MissionBoard />
      </template>
    </div>

    <!-- 底部 Goal Sheet 抽屉：通过 v-model:show 双向绑定控制显示/隐藏状态 -->
    <DirectionMobileGoalSheet
      v-model:show="showGoalSheet"
      :is-loading="isPageLoading"
    />

    <!-- 移动端添加目标按钮：固定在右下角，点击打开 AddGoalModal 弹窗 -->
    <Button
      class="mobile-add-button"
      @click="handleAddClick"
    >
      <Plus class="w-4 h-4" />
    </Button>

    <!-- 弹窗：添加/编辑目标（异步组件，按需加载以提升首屏性能）-->
    <AddGoalModal />
  </div>
</template>

<!--
  ============================================
  DirectionMobilePage.vue - 脚本部分
  ============================================

  【组件功能】
  移动端 Direction 模块主页面，采用"主内容优先 + 底部抽屉"的双层布局架构。
  页面加载时自动获取数据，底部抽屉包含目标选择、目标列表和任务归档功能。

  【状态管理】
  - showGoalSheet: 布尔值，控制底部 GoalSheet 抽屉的显示/隐藏
  - isPageLoading: 来自 useDirectionFetch，判断页面级数据加载状态
  - handleAddClick: 来自 useDirectionGoals，处理添加新目标的点击事件

  【组件结构】
  - GoalRangePicker: 月份范围选择器，允许用户切换查看不同月份的任务
  - MissionBoard: 月度任务面板，展示每日任务完成情况
  - DirectionMobileGoalSheet: 底部抽屉，包含目标列表选择和 MissionArchive
  - AddGoalModal: 添加/编辑目标的弹窗组件（异步加载）

  【Composables 依赖】
  - useDirectionFetch: 提供 isPageLoading 加载状态
  - useDirectionGoals: 提供 handleAddClick 等目标操作方法
-->
<script setup>
/* -------------------------------
   依赖导入
   ------------------------------- */
// Vue 核心：ref 用于响应式状态，defineAsyncComponent 实现组件异步懒加载
import { ref, defineAsyncComponent } from 'vue'
// Lucide 图标库：提供 Plus（加号）图标，用于添加目标按钮
import { Plus } from 'lucide-vue-next'

/* -------------------------------
   子组件导入
   ------------------------------- */
// GoalRangePicker: 月份范围选择器，切换不同月份的任务视图
import GoalRangePicker from '@/views/direction/components/GoalRangePicker.vue'
// MissionBoard: 月度任务面板核心组件，展示每日任务列表和完成状态
import MissionBoard from '@/views/direction/components/MissionBoard.vue'
// DirectionMobileGoalSheet: 移动端底部抽屉，提供目标选择、列表查看、归档等功能
import DirectionMobileGoalSheet from '@/views/direction/DirectionMobileGoalSheet.vue'
// Button: UI 组件库按钮，用于添加目标操作
import { Button } from '@/components/ui/button'

/* -------------------------------
   Composables 导入（业务逻辑）
   ------------------------------- */
// useDirectionFetch: 数据获取层，提供 isPageLoading 等页面级加载状态
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
// useDirectionGoals: 目标业务逻辑层，提供 handleAddClick 等目标操作方法
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'

/* -------------------------------
   异步组件定义
   ------------------------------- */
// AddGoalModal: 添加/编辑目标的弹窗组件
// 使用 defineAsyncComponent 实现按需加载（代码分割），避免首屏 bundle 体积过大
const AddGoalModal = defineAsyncComponent(() => import('@/views/direction/components/AddGoalModal.vue'))

/* -------------------------------
   Composables 调用
   ------------------------------- */
// 从数据获取 composable 获取页面级加载状态，用于控制骨架屏和抽屉的加载状态
const { isPageLoading } = useDirectionFetch()
// 从目标业务逻辑 composable 获取添加目标的事件处理方法
const { handleAddClick } = useDirectionGoals()

/* -------------------------------
   响应式状态
   ------------------------------- */
// showGoalSheet: 控制底部 GoalSheet 抽屉的显示状态
// - true: 抽屉打开，显示遮罩层
// - false: 抽屉关闭，隐藏遮罩层
// 初始值为 false，即页面加载时抽屉默认关闭
const showGoalSheet = ref(false)
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.mobile-root {
  @apply h-screen w-full bg-background flex flex-col overflow-hidden font-sans text-foreground relative;
}

.mobile-overlay {
  @apply fixed inset-0 z-[40] bg-black/40 backdrop-blur-[2px];
}

.mobile-content {
  @apply flex-1 overflow-y-auto pb-24;
}

.mobile-skeleton {
  @apply p-6;
}

.skeleton-block {
  @apply bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-md;
}

.mobile-add-button {
  @apply fixed bottom-24 right-6 z-30 w-11 h-11 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95;
}
</style>
