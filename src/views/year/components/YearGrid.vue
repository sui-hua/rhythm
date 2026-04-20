<template>
  <!--
    YearGrid: 年度视图的主网格组件
    - 响应式网格布局：移动端 2 列，平板 3 列，桌面 4 列
    - 每个单元格渲染一个月份的摘要信息
  -->
  <div class="h-full w-full bg-zinc-100 overflow-hidden">
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

<!--
  YearGrid Component

  概述：
  YearGrid 是年度视图的主容器组件，负责以网格形式展示一年中 12 个月的数据摘要。
  它是 Year 模块的顶层组件，接收整年的数据并将其分配给 12 个 MonthCell 子组件进行渲染。

  功能：
  - 以响应式网格布局展示 12 个月份
  - 响应式断点：移动端 2 列，平板 3 列，桌面 4 列
  - 提供进入月份详情的交互事件

  Props：
  - yearData: Array - 包含 12 个月份数据的数组，每个元素包含月份的摘要信息

  事件：
  - enterMonth: 当用户点击某个月份时触发，传递被点击月份的数据对象

  使用示例：
  <YearGrid
    :year-data="months"
    @enter-month="handleEnterMonth"
  />
-->
<script setup>
/**
 * Vue 3 Composition API <script setup> 语法
 * - 组件逻辑在此处定义
 * - 使用 defineProps 和 defineEmits 声明组件接口
 */

import MonthCell from '@/views/year/components/MonthCell.vue'

/**
 * 定义组件 Props
 * - yearData: Array 类型，接收包含 12 个月份数据的数组
 * - 用于在网格中渲染每个月份的 MonthCell 组件
 */
defineProps({
  yearData: Array
})

/**
 * 定义组件 Emit 事件
 * - enterMonth: 点击月份单元格时触发，通知父组件切换到月份详情视图
 * - 传递 month 对象给父组件，用于确定目标月份
 */
defineEmits(['enterMonth'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
