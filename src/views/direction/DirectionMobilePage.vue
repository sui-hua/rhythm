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
    <!-- 遮罩层 -->
    <div
      v-if="showGoalSheet"
      class="mobile-overlay"
      @click="showGoalSheet = false"
    ></div>

    <!-- 主内容区域：MissionBoard -->
    <div class="mobile-content">
      <div v-if="isPageLoading" class="mobile-skeleton">
        <div class="skeleton-block h-12 rounded-lg mb-4" />
        <div class="skeleton-block h-48 rounded-lg" />
      </div>
      <template v-else>
        <!-- 目标月份范围选择器 -->
        <GoalRangePicker />
        <!-- 月度任务面板 -->
        <MissionBoard />
      </template>
    </div>

    <!-- 底部 Goal Sheet 抽屉 -->
    <DirectionMobileGoalSheet
      v-model:show="showGoalSheet"
      :is-loading="isPageLoading"
    />

    <!-- 移动端添加目标按钮 -->
    <Button
      class="mobile-add-button"
      @click="handleAddClick"
    >
      <Plus class="w-4 h-4" />
    </Button>

    <!-- 弹窗：添加/编辑目标 -->
    <AddGoalModal />
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { Plus } from 'lucide-vue-next'
import GoalRangePicker from '@/views/direction/components/GoalRangePicker.vue'
import MissionBoard from '@/views/direction/components/MissionBoard.vue'
import DirectionMobileGoalSheet from '@/views/direction/DirectionMobileGoalSheet.vue'
import { Button } from '@/components/ui/button'
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'

const AddGoalModal = defineAsyncComponent(() => import('@/views/direction/components/AddGoalModal.vue'))

const { isPageLoading } = useDirectionFetch()
const { handleAddClick } = useDirectionGoals()

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
