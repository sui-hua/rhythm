<!--
  ============================================
  Direction 桌面端页面 (DirectionDesktopPage.vue)
  ============================================

  【模块职责】
  - 桌面端布局：三栏结构
  - DirectionSidebar → 左侧目标列表导航
  - MissionBoard → 中间月度任务面板
  - MissionArchive → 右侧任务归档/编辑面板

  【弹窗】
  - AddGoalModal → 添加/编辑目标
-->
<template>
  <div class="direction-root">
    <!-- 左侧导航：目标列表 -->
    <DirectionSidebar />

    <div class="direction-main">
      <!-- 页面级骨架 -->
      <div v-if="isPageLoading" class="direction-skeleton">
        <div class="skeleton-sidebar">
          <div class="skeleton-line w-3/4 h-4 rounded-md" />
          <div class="skeleton-line w-1/2 h-3 rounded-md mt-2" />
          <div class="skeleton-line w-2/3 h-4 rounded-md mt-4" />
          <div class="skeleton-line w-1/2 h-3 rounded-md mt-2" />
        </div>
        <div class="skeleton-content">
          <div class="skeleton-block h-12 rounded-lg mb-4" />
          <div class="skeleton-block h-48 rounded-lg" />
        </div>
      </div>
      <div v-else class="direction-content">
        <PageIntroBanner
          eyebrow="目标与承诺"
          :title="narrative.title"
          :subtitle="narrative.subtitle"
        />

        <ScrollArea class="direction-scroll">
          <!-- 目标月份范围选择器 -->
          <GoalRangePicker />

          <!-- 中间主面板：月度任务视板 -->
          <MissionBoard />
        </ScrollArea>

        <!-- 右侧：任务归档/编辑 -->
        <MissionArchive class="direction-archive" />
      </div>
    </div>

    <!-- 弹窗：添加/编辑目标 -->
    <AddGoalModal />
  </div>
</template>

<!--
================================================================================
DirectionDesktopPage.vue - 桌面端目标管理页面
================================================================================

【页面定位】
  桌面端布局下的目标（Direction）管理主页面，采用经典的三栏式布局。
  对应路由：/direction

【布局架构】
  ┌─────────────────┬───────────────────────────┬────────────────────┐
  │ DirectionSidebar │     中间主区域              │   MissionArchive   │
  │   (左侧导航)      │  ┌─────────────────────┐  │    (右侧归档)       │
  │                 │  │  PageIntroBanner    │  │                    │
  │  - 目标列表      │  │  目标与承诺 + 叙事   │  │  - 任务归档查看     │
  │  - 月份快速跳转  │  ├─────────────────────┤  │  - 任务编辑         │
  │  - 添加目标入口  │  │  GoalRangePicker    │  │  - 归档筛选         │
  │                 │  │  月份范围选择器      │  │                    │
  │                 │  ├─────────────────────┤  │                    │
  │                 │  │  MissionBoard       │  │                    │
  │                 │  │  月度任务面板        │  │                    │
  │                 │  └─────────────────────┘  │                    │
  └─────────────────┴───────────────────────────┴────────────────────┘

【核心数据流】
  1. useDirectionFetch() → 获取页面级加载状态 (isPageLoading)
  2. DirectionSidebar → 触发目标选择，更新全局目标状态
  3. GoalRangePicker → 选择月份范围，筛选显示的月度任务
  4. MissionBoard → 展示选中月份的任务列表，支持任务完成状态切换
  5. MissionArchive → 归档/编辑已完成的过往任务

【组件职责】
  - DirectionSidebar：目标导航侧边栏，提供目标列表和快速跳转
  - GoalRangePicker：月份范围选择器，控制 MissionBoard 显示范围
  - MissionBoard：月度任务面板，核心交互区域（任务增删改查）
  - MissionArchive：任务归档面板，支持查看历史任务和编辑
  - AddGoalModal：添加/编辑目标弹窗（异步加载，按需引入）

【Composables】
  - useDirectionFetch：页面级数据获取和加载状态管理

【页面叙事】
  - 通过 getPageNarrative('direction') 获取页面标题/副标题
  - 展示"目标与承诺"的核心理念

【样式说明】
  - 三栏布局：左侧 280px 固定宽度，中间最大 600px，右侧自适应
  - 使用 Tailwind CSS 4 的 @apply 语法
  - Skeleton 加载态：模拟三栏布局骨架屏，提升首屏体验

【关键样式类】
  - .direction-root：页面根容器，满屏 flex 布局
  - .direction-main：主内容区，包含骨架屏和实际内容切换
  - .direction-content：实际内容容器
  - .direction-scroll：中间滚动区域，含 MissionBoard
  - .direction-archive：右侧归档区域

【注意事项】
  - AddGoalModal 使用 defineAsyncComponent 异步加载，优化首屏性能
  - 骨架屏布局与实际内容布局保持一致，避免闪烁跳动
================================================================================
-->
<script setup>
import { defineAsyncComponent } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import DirectionSidebar from '@/views/direction/components/DirectionSidebar.vue'
import GoalRangePicker from '@/views/direction/components/GoalRangePicker.vue'
import MissionBoard from '@/views/direction/components/MissionBoard.vue'
import MissionArchive from '@/views/direction/components/MissionArchive.vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import PageIntroBanner from '@/components/PageIntroBanner.vue'
import { getPageNarrative } from '@/config/pageNarratives'

// 获取页面的叙事文案（标题 + 副标题），用于 PageIntroBanner 展示
const narrative = getPageNarrative('direction')

// 异步加载添加目标弹窗，按需引入避免首屏 bundle 过大
const AddGoalModal = defineAsyncComponent(() => import('@/views/direction/components/AddGoalModal.vue'))

// 页面级数据获取状态，用于控制骨架屏和内容区的切换
const { isPageLoading } = useDirectionFetch()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.no-scrollbar::-webkit-scrollbar { display: none; }
.direction-content::-webkit-scrollbar { display: none; }

.direction-root {
  @apply h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative;
}

.direction-main {
  @apply flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col;
}

.direction-content {
  @apply w-full h-full flex p-0 overflow-auto relative z-10;
}

.direction-scroll {
  @apply w-full max-w-[600px] border-r border-border bg-background relative z-20;
}

.direction-archive {
  @apply flex-1 relative z-10;
}

/* Skeleton styles */
.direction-skeleton {
  @apply w-full h-full flex p-0 overflow-auto relative z-10;
}

.skeleton-sidebar {
  @apply w-[280px] border-r border-border bg-background p-6 flex flex-col;
}

.skeleton-content {
  @apply flex-1 p-6;
}

.skeleton-line, .skeleton-block {
  @apply bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-md;
}
</style>
