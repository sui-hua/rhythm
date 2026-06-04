<template>
  <!--
    GlobalLoadingBar — 全局加载状态无障碍公告
    通过 aria-live 向屏幕阅读器播报加载状态，视觉上不可见
  -->
  <div
    class="sr-only"
    aria-live="polite"
    aria-label="页面加载中"
    role="status"
  >
    {{ isGlobalLoading ? '页面加载中' : '' }}
  </div>
</template>

<script lang="ts" setup>
/**
 * GlobalLoadingBar — 全局加载状态无障碍公告组件
 *
 * 监听全局加载状态，通过 aria-live 向屏幕阅读器播报加载进度。
 * 视觉上使用 sr-only 隐藏，仅服务于无障碍访问。
 */

// ── 依赖导入 ──
import { useGlobalLoading } from '@/composables/useGlobalLoading'

// ── 状态 ──
// 从全局加载 composable 获取加载状态
const { isGlobalLoading } = useGlobalLoading()
</script>
