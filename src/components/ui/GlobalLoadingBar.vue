<template>
  <div
    class="sr-only"
    aria-live="polite"
    aria-label="页面加载中"
    role="status"
  >
    {{ isGlobalLoading ? '页面加载中' : '' }}
  </div>
</template>

<script setup>
import { useGlobalLoading } from '@/composables/useGlobalLoading'

const { isGlobalLoading } = useGlobalLoading()
</script>
