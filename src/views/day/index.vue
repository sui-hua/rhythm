<template>
  <div class="day-page">
    <div class="day-layout">
      <!-- Sidebar Panel -->
      <Sidebar
        :class="['fade-in', isReady ? 'opacity-100' : 'opacity-0']"
        @scroll-to-task="scrollToTask"
        @add-event="openAddModal"
        @edit-task="openEditModal"
      />
      
      <!-- Main Timeline Area -->
      <Timeline
        ref="timeline"
        :class="['fade-in', isReady ? 'opacity-100' : 'opacity-0']"
        @edit-task="openEditModal"
        @select-task="scrollToTask"
      />

      <!-- Add/Edit Event Modal -->
      <AddEventModal
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import Sidebar from './components/Sidebar.vue'
import Timeline from './components/Timeline.vue'
import { useDayNavigation } from './composables/useDayNavigation'
import { useDayModal } from './composables/useDayModal'

// 弹窗组件按需加载 - 打开时才加载
const AddEventModal = defineAsyncComponent(() => import('./components/AddEventModal.vue'))

const { isReady, scrollToTask } = useDayNavigation()
const { showAddModal, editingTask, openAddModal, openEditModal } = useDayModal()
</script>

<style scoped>
@reference "@/assets/main.css";
.day-page {
  @apply h-screen w-full bg-background flex overflow-hidden font-sans text-foreground relative;
}
.day-page ::selection {
  @apply bg-primary text-primary-foreground;
}
.day-layout {
  @apply flex flex-1 h-full relative overflow-hidden bg-zinc-50/50;
}
.fade-in {
  @apply transition-opacity duration-300 ease-in-out;
}
</style>