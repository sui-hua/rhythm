<template>
  <Card class="month-card" :class="{ 'is-active': selectedMonth === month }">
    <MissionBoardMonthHeader :month="month" />
    <MissionBoardMonthBody v-if="selectedMonth === month" :month="month" />
  </Card>
</template>

<script setup>
/**
 * MissionBoardMonth.vue - 月度任务看板卡片组件
 * 
 * 功能说明：
 * - 展示单个月份的折叠式任务看板卡片
 * - 支持展开/折叠切换，通过 selectedMonth 控制显示状态
 * - 展开时显示该月的详细任务列表（MissionBoardMonthBody）
 * - 折叠时仅显示月份标题（MissionBoardMonthHeader）
 * 
 * 组件结构：
 * - Card: 卡片容器，根据选中状态添加激活样式
 * - MissionBoardMonthHeader: 月份标题栏组件
 * - MissionBoardMonthBody: 月份任务列表主体组件（仅展开时渲染）
 * 
 * 样式特点：
 * - 使用 Tailwind CSS 动画实现展开/折叠过渡效果
 * - 激活状态显示主色调边框环（ring）
 * - 支持悬停效果（hover:bg-accent/30）
 * 
 * 父组件关联：
 * - 由 MissionBoardMonthList 组件循环渲染
 * - 月份数据通过 props.month 传入
 * - 通过 useDirectionSelection composable 获取全局选中的月份状态
 * 
 * @see MissionBoardMonthHeader - 月份标题组件
 * @see MissionBoardMonthBody - 月份任务主体组件
 * @see useDirectionSelection - 方向选择状态管理
 */
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import MissionBoardMonthHeader from '@/views/direction/components/MissionBoardMonthHeader.vue'
import MissionBoardMonthBody from '@/views/direction/components/MissionBoardMonthBody.vue'
import { Card } from '@/components/ui/card'

const { month } = defineProps({
  month: {
    type: Number,
    required: true
  }
})

const { selectedMonth } = useDirectionSelection()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.month-card {
  @apply mb-4 rounded-xl transition-all duration-300 overflow-hidden border shadow-sm hover:bg-accent/30;
}

.month-card.is-active {
  @apply ring-1 ring-primary;
}
</style>
