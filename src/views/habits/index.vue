<!--
  ============================================
  Habits 视图 - 习惯追踪主页面 (views/habits/index.vue)
  ============================================

  【模块职责】
  - 习惯追踪模块主页面
  - 设备检测分发：桌面端 → HabitsDesktopPage，移动端 → HabitsMobilePage

  【布局结构】
  - HabitsDesktopPage: HabitSidebar + 主内容区 (PC 侧边栏+内容)
  - HabitsMobilePage: 主内容优先 + HabitMobileListSheet 底部抽屉
-->
<template>
  <HabitsDesktopPage v-if="!isMobile" />
  <HabitsMobilePage v-else />
</template>

<script setup>
/**
 * @file src/views/habits/index.vue
 * @description 习惯追踪模块的主页面入口组件
 *
 * 【职责说明】
 * - 习惯追踪模块的主入口页面，负责桌面端/移动端的设备检测与路由分发
 * - 不包含任何业务逻辑，仅做设备类型判断和组件渲染
 *
 * 【设备检测】
 * - 使用 useMobile composable 获取 isMobile 状态
 * - isMobile=true → 渲染 HabitsMobilePage（移动端优先布局）
 * - isMobile=false → 渲染 HabitsDesktopPage（桌面端侧边栏布局）
 *
 * 【布局差异】
 * - 桌面端：HabitsDesktopPage = HabitSidebar（侧边栏）+ 主内容区
 * - 移动端：HabitsMobilePage = 主内容优先 + HabitMobileListSheet（底部抽屉）
 *
 * 【关联组件】
 * - HabitsDesktopPage: src/views/habits/HabitsDesktopPage.vue
 * - HabitsMobilePage: src/views/habits/HabitsMobilePage.vue
 *
 * 【状态管理】
 * - 本组件无独立状态，完全依赖 useMobile composable 的响应式状态
 */
import { useMobile } from '@/composables/useMobile'
import HabitsDesktopPage from '@/views/habits/HabitsDesktopPage.vue'
import HabitsMobilePage from '@/views/habits/HabitsMobilePage.vue'

const { isMobile } = useMobile()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
