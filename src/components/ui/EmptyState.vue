<template>
  <div class="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-expo">
    <div class="mb-6 p-6 rounded-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5">
      <slot name="icon">
        <Compass class="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
      </slot>
    </div>
    <h3 class="text-xl font-bold tracking-tight text-foreground mb-2">{{ title }}</h3>
    <p class="text-sm text-muted-foreground max-w-[240px] leading-relaxed mb-8">
      {{ description }}
    </p>
    <slot name="action" />
  </div>
</template>

<script setup>
/**
 * EmptyState - 空状态展示组件
 *
 * @description
 * 当列表、数据或内容为空时展示的空状态组件，提供统一的视觉和交互体验。
 * 包含图标、标题、描述文字以及可选的操作按钮区域。
 *
 * @props
 * - title: string - 空状态的标题文字
 * - description: string - 空状态的描述文字，通常说明当前状态或引导用户操作
 *
 * @slots
 * - icon: 图标插槽，默认显示指南针图标 (Compass)
 * - action: 操作按钮插槽，用于放置"创建"、"刷新"等操作按钮
 *
 * @example
 * // &lt;EmptyState title="暂无任务" description="今天还没有任务安排"&gt;
 * //   &lt;template #action&gt;
 * //     &lt;Button&gt;创建任务&lt;/Button&gt;
 * //   &lt;/template&gt;
 * // &lt;/EmptyState&gt;
 */
import { Compass } from 'lucide-vue-next'
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.ease-expo {
  transition-timing-function: var(--ease-expo);
}
</style>
