<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground selection:bg-foreground selection:text-background relative">
    <!-- 左侧导航：目标列表 -->
    <DirectionSidebar />

    <div class="flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col">
      <!-- 页面级骨架 -->
      <div v-if="isPageLoading" class="w-full h-full flex p-0 overflow-auto relative z-10">
        <div class="w-[280px] border-r border-border bg-background p-6 flex flex-col">
          <div class="w-3/4 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div class="w-1/2 h-3 rounded-md mt-2 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div class="w-2/3 h-4 rounded-md mt-4 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div class="w-1/2 h-3 rounded-md mt-2 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div class="flex-1 p-6">
          <div class="h-12 rounded-lg mb-4 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
          <div class="h-48 rounded-lg bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
        </div>
      </div>
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

    <!-- 弹窗：添加/编辑目标 -->
    <AddGoalModal />

    <!-- 新手引导弹窗：首次进入所向模块时展示 -->
    <DirectionGuide :show="showGuide" @complete="onboardingStore.completeDirectionGuide()" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import DirectionSidebar from '@/views/direction/components/DirectionSidebar.vue'
import GoalRangePicker from '@/views/direction/components/GoalRangePicker.vue'
import MissionBoard from '@/views/direction/components/MissionBoard.vue'
import MissionArchive from '@/views/direction/components/MissionArchive.vue'
import DirectionGuide from '@/views/direction/components/DirectionGuide.vue'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useOnboardingStore } from '@/stores/onboardingStore'

const AddGoalModal = defineAsyncComponent(() => import('@/views/direction/components/AddGoalModal.vue'))

const { isPageLoading } = useDirectionFetch()

// 新手引导状态，未完成时首次进入显示引导弹窗
const onboardingStore = useOnboardingStore()
const showGuide = computed(() => !onboardingStore.directionGuideCompleted)
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.direction-content::-webkit-scrollbar { display: none; }
</style>
