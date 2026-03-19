<template>
  <aside class="sidebar" :style="{ width: width + 'px' }">
    <div class="resize-handle" :class="{ 'is-resizing': isResizing }" @mousedown="startResize"></div>

    <header class="sidebar-header">
      <div class="sidebar-title">
        <h2 class="sidebar-title-text">所向目标</h2>
      </div>
    </header>

    <ScrollArea class="sidebar-scroll">
      <div class="group-list">
        <div v-for="group in categorizedGoals" :key="group.category" class="group-block">
          <div class="group-header">
            <p class="group-label">{{ group.category }}</p>
          </div>

          <div class="goal-list">
            <button
              v-for="goal in group.items"
              :key="goal.plan_id"
              class="goal-button"
              :class="{ 'is-active': selectedGoalName === goal.name }"
              @click="selectGoal(goal)"
              @dblclick="handleEditGoal(goal)"
            >
              <div class="goal-row">
                <h4 class="goal-title" :class="{ 'is-active': selectedGoalName === goal.name }">
                  {{ goal.name }}
                </h4>
                <div class="goal-settings" @click.stop="handleEditGoal(goal)">
                  <Settings2 class="goal-settings-icon" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <footer class="sidebar-footer">
      <div class="footer-content">
        <div class="footer-metric">
          <span class="footer-label">系统推进负载</span>
          <span class="footer-value">65%</span>
        </div>
        <Progress :model-value="65" class="progress-bar" />
        <Button class="add-button" @click="handleAddClick">
          <Plus class="add-icon" />
          添加目标
        </Button>
      </div>
    </footer>
  </aside>
</template>

<script setup>
import { useDirectionFetch } from '@/views/direction/composables/useDirectionFetch'
import { useDirectionSelection } from '@/views/direction/composables/useDirectionSelection'
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { computed } from 'vue'
import { Plus, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { useResizable } from '@/composables/useResizable'

const { categorizedGoals } = useDirectionFetch()
const { selectedGoal, selectGoal } = useDirectionSelection()
const { handleAddClick, handleEditGoal } = useDirectionGoals()
const selectedGoalName = computed(() => selectedGoal.value?.name || '')

const { width, startResize, isResizing } = useResizable()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.sidebar {
  @apply border-r border-zinc-100 flex flex-col z-20 bg-background relative overflow-hidden h-full shrink-0;
}

.resize-handle {
  @apply absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors opacity-0;
}

.resize-handle.is-resizing {
  @apply bg-primary/20 opacity-100;
}

.sidebar-header {
  @apply px-6 pt-10 pb-6 shrink-0 border-b border-border mb-4;
}

.sidebar-title {
  @apply flex flex-col gap-2;
}

.sidebar-title-text {
  @apply text-2xl font-semibold tracking-tight;
}

.sidebar-scroll {
  @apply flex-1 px-4 relative z-10;
}

.sidebar-scroll::-webkit-scrollbar { display: none; }

.group-list {
  @apply flex flex-col gap-8 pb-24 pt-2;
}

.group-block {
  @apply flex flex-col gap-2;
}

.group-header {
  @apply flex items-center gap-2 mb-4 pl-1;
}

.group-label {
  @apply text-[10px] font-bold text-muted-foreground uppercase tracking-[0.02em];
}

.goal-list {
  @apply flex flex-col gap-2;
}

.goal-button {
  @apply flex flex-col items-start gap-1 p-3 mx-1 rounded-lg transition-all text-left;
}

.goal-button.is-active {
  @apply bg-secondary ring-1 ring-border shadow-sm;
}

.goal-row {
  @apply flex items-center justify-between w-full gap-3;
}

.goal-title {
  @apply text-sm font-semibold tracking-tight transition-colors flex-1 truncate text-muted-foreground;
}

.goal-title.is-active {
  @apply text-foreground;
}

.goal-settings {
  @apply opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer hover:bg-zinc-200/50;
}

.sidebar:hover .resize-handle {
  @apply opacity-100;
}

.resize-handle:hover {
  @apply bg-primary/10;
}

.goal-button:hover {
  @apply bg-zinc-50;
}

.goal-button:hover .goal-title {
  @apply text-foreground;
}

.goal-button:hover .goal-settings {
  @apply opacity-100;
}

.goal-settings-icon {
  @apply w-3.5 h-3.5 text-muted-foreground;
}

.sidebar-footer {
  @apply p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10;
}

.footer-content {
  @apply w-full flex flex-col gap-4;
}

.footer-metric {
  @apply flex justify-between items-center mb-2;
}

.footer-label {
  @apply text-[10px] font-medium text-muted-foreground uppercase tracking-widest;
}

.footer-value {
  @apply text-[10px] font-bold text-primary;
}

.progress-bar {
  @apply h-1;
}

.add-button {
  @apply w-full gap-2 h-9 text-xs font-semibold;
}

.add-icon {
  @apply w-4 h-4;
}
</style>
