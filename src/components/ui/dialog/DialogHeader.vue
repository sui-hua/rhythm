<!--
  DialogHeader 组件 - 对话框头部
  Props: class
-->
<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="cn('flex flex-col gap-y-1.5 text-center sm:text-left', props.class)"
  >
    <slot />
  </div>
</template>
