<template>
  <!--
    Habits 入口 — 习惯追踪模块，委托给桌面端页面组件渲染
  -->
  <HabitsDesktopPage />
</template>

<script lang="ts" setup>
/**
 * Habits 入口脚本
 * 职责：作为路由入口，直接委托给 HabitsDesktopPage 渲染完整内容
 */

// ── 依赖导入 ──
import HabitsDesktopPage from '@/views/habits/HabitsDesktopPage.vue'
</script>

<style scoped>
</style>
