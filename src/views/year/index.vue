<template>
  <!--
    Year 页面 — 年度总览视图入口
    主要结构：12 个月份热力图网格，点击月份进入月度视图
  -->
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <!-- 年度网格，展示每月习惯打卡热力图 -->
    <YearGrid
      :year-data="yearData"
      @enter-month="enterMonth"
    />
  </div>
</template>

<script lang="ts" setup>
/**
 * Year 页面入口
 * 纯展示层，所有逻辑委托给 useYearView composable
 * 数据流：useYearView → yearData / enterMonth → YearGrid 组件
 */

// ── 依赖导入 ──
import { useYearView } from '@/views/year/composables/useYearView'
import YearGrid from '@/views/year/components/YearGrid.vue'

// ── 视图状态 ──
// 从 composable 获取年度打卡数据和月份点击导航方法
const { yearData, enterMonth } = useYearView()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
