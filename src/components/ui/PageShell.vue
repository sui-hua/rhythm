<template>
  <!--
    PageShell - 页面容器组件
    功能：提供统一的页面布局容器，包含以下特性：
    1. 响应式最大宽度限制（maxWidth）
    2. 统一的水平内边距（padding）
    3. 插槽机制支持任意页面内容
  -->
  <div class="mx-auto w-full" :style="{ maxWidth: uiGrammar.page.maxWidth, padding: uiGrammar.page.padding }">
    <!-- 页面内容插槽，由子组件填充 -->
    <slot />
  </div>
</template>

<script setup>
/**
 * @file PageShell.vue
 * @description 页面外壳组件 - 为所有页面提供统一布局容器
 *
 * 功能说明：
 * - 限制页面最大宽度，防止内容过宽影响阅读
 * - 提供一致的页面内边距
 * - 通过插槽机制承载具体页面内容
 *
 * 使用方式：
 * <PageShell>页面内容</PageShell>
 *
 * 样式来源：
 * - maxWidth 和 padding 均从 uiGrammar 配置中心读取
 * - 支持 light/dark 双主题自动适配
 */
import { uiGrammar } from '@/config/uiGrammar'
</script>
