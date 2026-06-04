<template>
  <!--
    Month 页面 — 月度日历视图入口
    主要结构：全屏月历网格，点击日期进入日视图
  -->
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <!-- 月历网格区域，固定定位覆盖全屏 -->
    <div class="fixed inset-0 z-[90] h-full w-full bg-background flex flex-col">
      <MonthGrid
        :month-grid-data="monthGridData"
        @enter-day="enterDay"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * Month 页面入口
 * 纯展示层，所有逻辑委托给 useMonthView composable
 * 数据流：useMonthView → monthGridData / enterDay → MonthGrid 组件
 */

// ── 依赖导入 ──
import { useMonthView } from '@/views/month/composables/useMonthView'
import MonthGrid from '@/views/month/components/MonthGrid.vue'

// ── 视图状态 ──
// 从 composable 获取月历网格数据和日期点击导航方法
const { monthGridData, enterDay } = useMonthView()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
