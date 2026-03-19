<template>
  <div class="direction-root">
    <!-- 左侧导航：目标列表 -->
    <DirectionSidebar />

    <div class="direction-main">
      <div class="direction-content">
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

<script setup>
import { defineAsyncComponent } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import DirectionSidebar from '@/views/direction/components/DirectionSidebar.vue'
import GoalRangePicker from '@/views/direction/components/GoalRangePicker.vue'
import MissionBoard from '@/views/direction/components/MissionBoard.vue'
import MissionArchive from '@/views/direction/components/MissionArchive.vue'

const AddGoalModal = defineAsyncComponent(() => import('@/views/direction/components/AddGoalModal.vue'))
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
</style>
