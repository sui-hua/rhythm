<template>
  <!--
    PageShell — 页面布局容器
    主要结构：居中限宽容器 + 内容插槽
  -->
  <div class="mx-auto w-full" :style="{ maxWidth: uiGrammar.page.maxWidth, padding: uiGrammar.page.padding }">
    <!-- 页面内容插槽，由各页面组件填充 -->
    <slot />
  </div>
</template>

<script lang="ts" setup>
/**
 * PageShell — 页面布局容器组件
 *
 * 为所有页面提供统一的布局容器，限制最大宽度并保持一致的内边距。
 * maxWidth 和 padding 均从 uiGrammar 配置中心读取。
 */

// ── 依赖导入 ──
import { uiGrammar } from '@/config/uiGrammar'
</script>
