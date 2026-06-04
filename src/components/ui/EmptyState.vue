<template>
  <!--
    EmptyState — 空状态展示组件
    主要结构：图标区、标题、描述文字、操作按钮插槽
  -->
  <div class="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-expo">
    <!-- 图标区：默认显示指南针，可通过 icon 插槽自定义 -->
    <div class="mb-6 p-6 rounded-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
      <slot name="icon">
        <Compass class="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
      </slot>
    </div>
    <!-- 标题 -->
    <h3 class="text-xl font-bold tracking-tight text-foreground mb-2">{{ title }}</h3>
    <!-- 描述文字 -->
    <p class="text-sm text-muted-foreground max-w-[240px] leading-relaxed mb-8">
      {{ description }}
    </p>
    <!-- 操作按钮插槽：放置"创建"、"刷新"等操作 -->
    <slot name="action" />
  </div>
</template>

<script lang="ts" setup>
/**
 * EmptyState — 空状态展示组件
 *
 * 当列表、数据或内容为空时展示的占位组件，提供统一的视觉和交互体验。
 * 包含图标、标题、描述文字以及可选的操作按钮区域。
 */

// ── 依赖导入 ──
import { Compass } from 'lucide-vue-next'

// ── Props ──
// 空状态的标题文字
// 空状态的描述文字，通常说明当前状态或引导用户操作
defineProps({
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.ease-expo {
  transition-timing-function: var(--ease-expo);
}
</style>
