<!--
  ============================================
  Month 视图 - 月度视图页面 (views/month/index.vue)
  ============================================

  【模块职责】
  - 月度视图主页面
  - 显示当月日历网格
  - 点击日期进入日视图

  【布局结构】
  - MonthGrid → 月历网格组件

  【路由参数】
  - /month/:year/:month
-->
<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <div class="fixed inset-0 z-[90] h-full w-full bg-background flex flex-col">
      <MonthGrid
        :month-grid-data="monthGridData"
        @enter-day="enterDay"
      />
    </div>
  </div>
</template>

<!--
================================================================================
Month 视图 - 月度视图页面 (src/views/month/index.vue)
================================================================================

模块职责
--------
- 月度视图主页面，展示当月日历网格
- 提供月份导航和日期选择功能
- 点击日期导航到日视图 /day/:year/:month/:day

组件结构
--------
- MonthGrid: 月历网格组件，显示星期标题和日期格子

Composables
-----------
- useMonthView: 月度视图逻辑 hook，提供：
  - monthGridData: 月份网格数据（当月日期矩阵）
  - enterDay: 导航到日视图的回调函数

路由参数
--------
- /month/:year/:month - 月份路由，year 和 month 为 URL 参数

数据流
------
1. useMonthView 从 dateStore 获取当前日期
2. 计算月份网格数据（6 行 × 7 列 = 42 格的日历矩阵）
3. MonthGrid 接收 monthGridData 渲染日历
4. 用户点击日期格子时触发 enterDay 事件
5. enterDay 导航到 /day/:year/:month/:day 路由

样式说明
--------
- 全屏布局：h-screen w-full 占满视口
- 背景色：bg-background（支持 light/dark 双主题）
- MonthGrid 采用 fixed 定位覆盖全屏，z-index 为 90
================================================================================
-->
<script setup>
import { useMonthView } from '@/views/month/composables/useMonthView'
import MonthGrid from '@/views/month/components/MonthGrid.vue'

const { monthGridData, enterDay } = useMonthView()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
