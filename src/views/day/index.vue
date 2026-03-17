<template>
  <div class="day-page">
    <div class="day-layout">
      <!-- Sidebar Panel -->
      <Sidebar
        :class="[
          'fade-in', 
          isReady ? 'opacity-100' : 'opacity-0',
          isMobile && !showSidebar ? '-translate-x-full' : 'translate-x-0'
        ]"
        :is-mobile="isMobile"
        :show="showSidebar"
        @scroll-to-task="scrollToTask"
        @add-event="openAddModal"
        @edit-task="openEditModal"
        @close="showSidebar = false"
      />
      
      <!-- Main Timeline Area -->
      <Timeline
        ref="timeline"
        :class="['fade-in', isReady ? 'opacity-100' : 'opacity-0']"
        :current-hour="currentHour"
        @edit-task="openEditModal"
        @select-task="scrollToTask"
      />

      <!-- Mobile Menu Button -->
      <button 
        v-if="isMobile"
        class="mobile-menu-btn"
        @click="showSidebar = !showSidebar"
      >
        <Menu v-if="!showSidebar" class="w-5 h-5" />
        <X v-else class="w-5 h-5" />
      </button>

      <!-- Add/Edit Event Modal/Drawer -->
      <AddEventModal
        v-if="!isMobile"
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />

      <MobileAddEventDrawer
        v-else
        v-model:show="showAddModal"
        :initial-data="editingTask"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { Menu, X } from 'lucide-vue-next'
import Sidebar from './components/Sidebar.vue'
import Timeline from './components/Timeline.vue'
import { useDayNavigation } from './composables/useDayNavigation'
import { useDayModal } from './composables/useDayModal'
import { useMobile } from '@/composables/useMobile'

// 弹窗组件按需加载 - 打开时才加载
const AddEventModal = defineAsyncComponent(() => import('./components/AddEventModal.vue'))
const MobileAddEventDrawer = defineAsyncComponent(() => import('./components/MobileAddEventDrawer.vue'))

const { isReady, scrollToTask, currentHour } = useDayNavigation()
const { showAddModal, editingTask, openAddModal, openEditModal } = useDayModal()
const { isMobile } = useMobile()

const showSidebar = ref(false)
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
@reference "tailwindcss/utilities";
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
  @apply transition-all duration-300 ease-in-out;
}
.mobile-menu-btn {
  @apply fixed bottom-8 right-8 z-30 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95;
}
</style>