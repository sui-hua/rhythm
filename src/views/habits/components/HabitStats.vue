<!--
  HabitStats.vue - 习惯统计数据看板组件

  功能说明：
  本组件用于在习惯模块中展示关键统计指标的汇总视图，以卡片网格的形式
  呈现多个统计数据项。每个统计项包含标签、数值和单位，适用于展示
  如连击天数、完成率、当前等级等习惯相关数据。

  使用场景：
  - 习惯详情页面顶部数据概览
  - 习惯列表页的统计摘要
  - 仪表盘首页的关键指标展示

  响应式设计：
  - 移动端 (md以下)：2列网格布局
  - 桌面端 (md及以上)：4列网格布局

  依赖样式：
  - Tailwind CSS 工具类
  - 全局 CSS 变量：background、muted-foreground、foreground
-->
<script setup>
/**
 * 习惯统计数据看板组件
 * 
 * 功能：展示习惯相关的关键统计数据，以卡片网格形式呈现
 * 适用场景：习惯模块中的统计概览区域
 * 
 * @component
 * @example
 * // 引入方式
 * import HabitStats from './components/HabitStats.vue'
 * 
 * // 使用示例
 * <HabitStats :stats="[
 *   { label: '连击', value: '7', unit: '天' },
 *   { label: '完成率', value: '85', unit: '%' },
 *   { label: '等级', value: '5', unit: '级' },
 *   { label: '总天数', value: '30', unit: '天' }
 * ]" />
 */
defineProps({
  /**
   * 包含具体统计项目数据的数组。
   * 格式约束要求：[{ label: '标题', value: '数值', unit: '单位后缀' }, ...]
   */
  stats: {
    type: Array,
    required: true
  }
})
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
    <div v-for="stat in stats" :key="stat.label" 
         class="bg-background p-4 rounded-xl border flex flex-col justify-center gap-1 shadow-sm">
      <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{{ stat.label }}</span>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold tracking-tight">{{ stat.value }}</span>
        <span class="text-[10px] font-medium text-muted-foreground">{{ stat.unit }}</span>
      </div>
    </div>
  </div>
</template>
