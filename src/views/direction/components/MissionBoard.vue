<template>
  <!--
    MissionBoard — 使命看板主容器
    主要结构：月份任务列表（按活跃月份范围动态渲染）
  -->
  <div class="board-root" @mouseup="endSelection">
    <!-- 月份任务列表开始 -->
    <TransitionGroup name="list">
      <MissionBoardMonth v-for="m in activeMonthRange" :key="m" :month="m" />
    </TransitionGroup>
    <!-- 月份任务列表结束 -->
  </div>
</template>

<script lang="ts" setup>
/**
 * MissionBoard — 使命看板主容器
 * 职责：根据活跃月份范围渲染 MissionBoardMonth 列表
 * 数据流：useDirectionGoals.activeMonthRange → MissionBoardMonth（子组件）
 */

// ── 依赖导入 ──
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import MissionBoardMonth from '@/views/direction/components/MissionBoardMonth.vue'

// ── Composables ──
// 获取当前目标的活跃月份范围
const { activeMonthRange } = useDirectionGoals()
// endSelection 用于鼠标松开时结束框选操作
const { endSelection } = useDirectionSelection()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.board-root {
  @apply pb-32 px-6;
}

@media (min-width: 768px) {
  .board-root {
    @apply px-10;
  }
}
</style>
