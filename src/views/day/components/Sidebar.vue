<template>
  <aside class="sidebar" :style="{ width: width + 'px' }">
    <!-- 侧边栏宽度拖拽调整手柄 -->
    <div 
      class="sidebar__resize-handle"
      :class="{ 'sidebar__resize-handle--active': isResizing }"
      @mousedown="startResize">
    </div>

    <header class="sidebar__header">
      <div class="sidebar__header-content">
        <h2 class="sidebar__title">{{ selectedDay }}日</h2>
        <p class="sidebar__subtitle">{{ selectedMonthName }} 任务清单</p>
      </div>
    </header>

    <!-- 侧边栏任务列表，可滚动 -->
    <ScrollArea class="sidebar__list">
      <div class="sidebar__list-inner">
        <div v-for="(item, index) in dailySchedule" :key="index" 
             @click="$emit('scrollToTask', index)"
             @dblclick="$emit('edit-task', index)"
             class="sidebar__item group"
             :class="[item.completed ? 'sidebar__item--completed' : 'sidebar__item--active']">
          
          <div @click.stop @dblclick.stop>
            <Checkbox 
              :checked="item.completed" 
              @update:checked="handleToggleComplete(item)"
              class="sidebar__checkbox"
            />
          </div>

          <div class="sidebar__item-content">
            <div class="sidebar__item-row">
              <h4 class="sidebar__item-title" :class="{ 'sidebar__item-title--done': item.completed, 'sidebar__item-title--hover': !item.completed }">
                {{ item.title }}
              </h4>
              <div 
                class="sidebar__edit-btn"
                @click.stop="$emit('edit-task', index)"
              >
                <Settings2 class="sidebar__edit-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- 侧边栏底部统计和添加按钮 -->
    <footer class="sidebar__footer">
      <div class="w-full">
        <div class="sidebar__progress-header">
          <span class="sidebar__progress-label">任务完成度</span>
          <span class="sidebar__progress-value">{{ Math.round((dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)) }}%</span>
        </div>
        <Progress :model-value="(dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)" class="h-1 shadow-none" />
      </div>
      <Button 
        class="sidebar__add-btn"
        @click="$emit('add-event')"
      >
        <Plus class="w-4 h-4" />
        添加项目
      </Button>
    </footer>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useResizable } from '@/composables/useResizable'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { useDayData } from '../composables/useDayData'

const dateStore = useDateStore()
const { dailySchedule, completedCount, handleToggleComplete } = useDayData()
const { width, startResize, isResizing } = useResizable()

const selectedDay = computed(() => dateStore.currentDate.getDate())
const selectedMonthName = computed(() => getMonthName(dateStore.currentDate.getMonth() + 1, 'full'))

defineEmits(['scrollToTask', 'add-event', 'edit-task'])
</script>

<style scoped>
@reference "@/assets/main.css";
.sidebar {
  @apply border-r border-zinc-100 flex flex-col z-20 bg-background relative overflow-hidden;
}
.sidebar__resize-handle {
  @apply absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors opacity-0;
}
.sidebar:hover .sidebar__resize-handle {
  @apply opacity-100;
}
.sidebar__resize-handle:hover {
  @apply bg-primary/10;
}
.sidebar__resize-handle--active {
  @apply bg-primary/20 opacity-100;
}
.sidebar__header {
  @apply px-6 pt-10 pb-6 shrink-0 border-b border-border mb-4;
}
.sidebar__header-content {
  @apply flex flex-col gap-2;
}
.sidebar__title {
  @apply text-2xl font-semibold tracking-tight;
}
.sidebar__subtitle {
  @apply text-xs text-muted-foreground;
}
.sidebar__list {
  @apply flex-1 px-4 relative z-10;
}
.sidebar__list-inner {
  @apply flex flex-col gap-2 pb-24 pt-2;
}
.sidebar__item {
  @apply flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer;
}
.sidebar__item--completed {
  @apply opacity-50;
}
.sidebar__item--active:hover {
  @apply bg-zinc-50;
}
.sidebar__checkbox {
  @apply shrink-0 w-5 h-5 rounded-md;
}
.sidebar__item-content {
  @apply flex-1 min-w-0 flex flex-col gap-0.5;
}
.sidebar__item-row {
  @apply flex items-center justify-between gap-2 w-full;
}
.sidebar__item-title {
  @apply text-sm font-semibold tracking-tight truncate transition-all;
}
.sidebar__item-title--done {
  @apply line-through text-muted-foreground;
}
.sidebar__item--active:hover .sidebar__item-title--hover {
  @apply text-foreground;
}
.sidebar__edit-btn {
  @apply opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer;
}
.sidebar__edit-btn:hover {
  @apply bg-zinc-200/50;
}
.sidebar__item:hover .sidebar__edit-btn {
  @apply opacity-100;
}
.sidebar__edit-icon {
  @apply w-3.5 h-3.5 text-muted-foreground;
}
.sidebar__footer {
  @apply p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10 flex flex-col gap-4;
}
.sidebar__progress-header {
  @apply flex justify-between items-center mb-2;
}
.sidebar__progress-label {
  @apply text-[10px] font-medium text-muted-foreground uppercase tracking-widest;
}
.sidebar__progress-value {
  @apply text-[10px] font-bold text-primary;
}
.sidebar__add-btn {
  @apply w-full gap-2 h-9 text-xs font-semibold;
}
</style>