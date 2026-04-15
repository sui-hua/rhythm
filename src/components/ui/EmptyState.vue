<!--
  EmptyState 组件 - 空状态占位组件
  Props: title, description，提供图标插槽和操作按钮插槽
-->
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
import { Compass } from 'lucide-vue-next'
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.ease-expo {
  transition-timing-function: var(--ease-expo);
}
</style>
