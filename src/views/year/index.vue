<!--
  ============================================
  Year 视图 - 年度总览页面 (views/year/index.vue)
  ============================================

  【模块职责】
  - 年度总览主页面
  - 显示 12 个月的习惯打卡热力图
  - 点击月份进入月视图

  【布局结构】
  - YearGrid → 年历网格组件

  【路由参数】
  - /year/:year
-->
<template>
  <div class="h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative selection:bg-foreground selection:text-background">
    <YearGrid
      :year-data="yearData"
      @enter-month="enterMonth"
    />
  </div>
</template>

<script setup>
import { useYearView } from '@/views/year/composables/useYearView'
import YearGrid from '@/views/year/components/YearGrid.vue'

const { yearData, enterMonth } = useYearView()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
