<template>
  <Transition name="global-loading-fade">
    <div
      v-if="isGlobalLoading"
      class="global-loading"
      aria-live="polite"
      aria-label="页面加载中"
      role="status"
    >
      <div class="global-loading-track">
        <div class="global-loading-bar" />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useGlobalLoading } from '@/composables/useGlobalLoading'
const { isGlobalLoading } = useGlobalLoading()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.global-loading {
  @apply fixed top-0 left-0 right-0 z-[9999] pointer-events-none;
}

.global-loading-track {
  @apply h-1 w-full bg-transparent;
}

.global-loading-bar {
  @apply h-full bg-primary origin-left;
  animation: loading-bar-indeterminate 1s ease-in-out infinite;
}

@keyframes loading-bar-indeterminate {
  0% {
    transform: translateX(-100%) scaleX(0.3);
  }
  50% {
    transform: translateX(30%) scaleX(0.7);
  }
  100% {
    transform: translateX(100%) scaleX(0.3);
  }
}

.global-loading-fade-enter-active,
.global-loading-fade-leave-active {
  transition: opacity 0.2s ease;
}

.global-loading-fade-enter-from,
.global-loading-fade-leave-to {
  opacity: 0;
}
</style>
