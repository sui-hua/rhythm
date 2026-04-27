<template>
  <div class="board-root" @mouseup="endSelection">
    <TransitionGroup name="list">
      <MissionBoardMonth v-for="m in activeMonthRange" :key="m" :month="m" />
    </TransitionGroup>
  </div>
</template>

<script setup>
/**
 * MissionBoard.vue - 任务面板根组件
 * 
 * 作用：Direction 模块的主画布，负责渲染当前激活月份范围内的所有月度任务卡片。
 * 
 * 工作机制：
 * - 从 useDirectionGoals 获取当前可视的月份范围（activeMonthRange）
 * - 遍历月份范围，渲染 <MissionBoardMonth> 子组件展示每个月的任务
 * - 监听鼠标释放事件（endSelection），用于取消当前的多选操作
 * 
 * 样式说明：
 * - 根容器 board-root 设置底部留白（pb-32）和水平内边距（px-6）
 * - 响应式：桌面端（md+）增加水平内边距（px-10）
 * 
 * 动画：使用 TransitionGroup 实现任务卡片列表的进入/离开动画（name="list"）
 * 
 * 关联 composables：
 * - useDirectionGoals: 提供月份范围数据
 * - useDirectionSelection: 提供选择交互逻辑（endSelection）
 */
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import MissionBoardMonth from '@/views/direction/components/MissionBoardMonth.vue'

const { activeMonthRange } = useDirectionGoals()
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
