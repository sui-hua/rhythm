<template>
  <!--
    YearGrid: 年度视图的主网格组件
    - 响应式网格布局：移动端 2 列，平板 3 列，桌面 4 列
    - 每个单元格渲染一个月份的摘要信息
  -->
  <div class="h-full w-full bg-muted overflow-hidden">
    <!--
      网格容器
      - 使用 Tailwind Grid 实现响应式列数
      - gap-px: 单元格之间使用 1px 间隙，形成分隔线效果
    -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 w-full h-full gap-px">
      <!--
        月份单元格循环
        - v-for 遍历 yearData 数组，渲染 12 个月份
        - :key 使用 month.name 确保列表渲染性能
        - :month 传递月份数据对象给 MonthCell 组件
        - @enter-month 监听子组件的进入月份事件，冒泡给父组件
      -->
      <MonthCell
        v-for="month in yearData"
        :key="month.name"
        :month="month"
        @enter-month="$emit('enterMonth', month)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import MonthCell from '@/views/year/components/MonthCell.vue'

/** 月份数据结构，与 MonthCell props 保持一致 */
interface MonthData {
  name: string
  days: number
  firstDayOffset: number
  completedDays?: number[]
}

defineProps<{
  yearData: MonthData[]
}>()

defineEmits(['enterMonth'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
