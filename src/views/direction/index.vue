<template>
  <!--
    Direction 页面 — 长期目标管理，支持三级级联：plans → monthly_plans → daily_plans
    主要结构：左侧导航、骨架屏/主内容区、添加目标弹窗、新手引导
  -->
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground selection:bg-foreground selection:text-background relative">
    <!-- 左侧导航：目标列表 -->
    <DirectionSidebar />

    <div class="flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col">
      <!-- 页面级骨架：数据加载中展示占位动画 -->
      <div v-if="isPageLoading" class="w-full h-full flex p-0 overflow-auto relative z-10">
        <div class="w-[280px] border-r border-border bg-background p-6 flex flex-col">
          <div class="w-3/4 h-4 rounded-md bg-muted animate-pulse" />
          <div class="w-1/2 h-3 rounded-md mt-2 bg-muted animate-pulse" />
          <div class="w-2/3 h-4 rounded-md mt-4 bg-muted animate-pulse" />
          <div class="w-1/2 h-3 rounded-md mt-2 bg-muted animate-pulse" />
        </div>
        <div class="flex-1 p-6">
          <div class="h-12 rounded-lg mb-4 bg-muted animate-pulse" />
          <div class="h-48 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
      <!-- 主内容区：目标范围选择、任务面板、归档 -->
      <div v-else class="direction-content w-full h-full flex p-0 overflow-auto relative z-10">
        <ScrollArea class="w-full max-w-[600px] border-r border-border bg-background relative z-20">
          <!-- 目标月份范围选择器 -->
          <GoalRangePicker />
          <!-- 中间主面板：月度任务视板 -->
          <MissionBoard />
        </ScrollArea>

        <!-- 右侧：任务归档/编辑 -->
        <MissionArchive class="flex-1 relative z-10" />
      </div>
    </div>

    <!-- 添加/编辑目标弹窗 -->
    <AddGoalModal />

    <!-- 新手引导弹窗：首次进入所向模块时展示 -->
    <DirectionGuide :show="showGuide" @complete="onboardingStore.completeDirectionGuide()" />
  </div>
</template>

<script lang="ts" setup>
/**
 * Direction 页面脚本
 * 职责：协调左侧导航、主内容区、弹窗的渲染，控制新手引导显示
 * 数据流：useDirectionFetch → isPageLoading → 骨架屏/主内容切换
 */

// ── 依赖导入 ──
import { computed, defineAsyncComponent } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import DirectionSidebar from '@/views/direction/components/DirectionSidebar.vue'
import GoalRangePicker from '@/views/direction/components/GoalRangePicker.vue'
import MissionBoard from '@/views/direction/components/MissionBoard.vue'
import MissionArchive from '@/views/direction/components/MissionArchive.vue'
import DirectionGuide from '@/views/direction/components/DirectionGuide.vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useOnboardingStore } from '@/stores/onboardingStore'

// 异步加载 AddGoalModal，减少首屏包体积
const AddGoalModal = defineAsyncComponent(() => import('@/views/direction/components/AddGoalModal.vue'))

// ── Composables ──
// 目标数据加载：控制页面级骨架屏显示
const { isPageLoading } = useDirectionFetch()

// ── Store ──
// 新手引导状态，未完成时首次进入显示引导弹窗
const onboardingStore = useOnboardingStore()

// ── 计算属性 ──
// 引导弹窗显隐：未完成引导时显示
const showGuide = computed(() => !onboardingStore.directionGuideCompleted)
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.direction-content::-webkit-scrollbar { display: none; }
</style>
