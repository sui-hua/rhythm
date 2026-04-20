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

/**
 * @fileoverview Year 年度总览视图组件
 * @module views/year/index
 * 
 * @description
 * 年度总览页面组件，展示用户全年的习惯打卡热力图。
 * 用户可以直观地看到 12 个月的习惯完成情况，点击月份可进入月视图查看详情。
 * 
 * @feature
 * - 渲染 12 个月的习惯打卡热力图（YearGrid 组件）
 * - 支持点击月份跳转到月视图
 * - 全屏布局，沉浸式体验
 * 
 * @componentdata
 * - yearData: 从 useYearView composable 获取的年度数据
 * 
 * @composables
 * - useYearView: 提供年度数据管理和导航逻辑
 * 
 * @subcomponents
 * - YearGrid: 年历网格组件，负责渲染热力图
 * 
 * @routedata
 * - 路由路径: /year/:year
 * - 路由参数: year (Number) - 年份，如 2024
 * 
 * @styling
 * - 使用 Tailwind CSS 进行样式管理
 * - 主题变量引用: @/assets/tw-theme.css
 * 
 * @seelso
 * - src/views/year/composables/useYearView.ts - 年度视图逻辑
 * - src/views/year/components/YearGrid.vue - 年历网格组件
 */

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
