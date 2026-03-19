<template>
  <aside 
    class="border-r border-zinc-100 flex flex-col z-20 overflow-hidden transition-all duration-300 group"
    :class="[
      !isMobile ? 'relative bg-background' : 'fixed left-0 top-0 bottom-0 z-50 bg-background/60 dark:bg-zinc-900/60 backdrop-blur-2xl shadow-xl',
      isMobile && show ? 'shadow-2xl' : ''
    ]"
    :style="{ width: isMobile ? '280px' : width + 'px' }"
  >
    <div
      v-if="isLoading"
      class="absolute inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3 px-4 py-2 rounded-full bg-background/80 border border-zinc-100 shadow-lg">
        <div class="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
        <span class="text-xs font-semibold text-zinc-600 tracking-wide">加载中…</span>
      </div>
    </div>
    <!-- 侧边栏宽度拖拽调整手柄 (仅桌面端) -->
    <div 
      v-if="!isMobile"
      class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors opacity-0 group-hover:opacity-100 hover:bg-primary/10"
      :class="{ 'bg-primary/20 opacity-100': isResizing }"
      @mousedown="startResize">
    </div>

    <header class="px-6 pt-10 pb-6 shrink-0 border-b border-border/10 mb-4 bg-transparent">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-semibold tracking-tight">{{ selectedDay }}日</h2>
          <Button 
            v-if="isMobile" 
            variant="ghost" 
            size="icon" 
            class="-mr-2 h-8 w-8"
            @click="$emit('close')"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        <p class="text-xs text-muted-foreground">{{ selectedMonthName }} 任务清单</p>
      </div>
    </header>

    <!-- 侧边栏任务列表，可滚动 -->
    <ScrollArea class="flex-1 px-4 relative z-10">
      <div class="flex flex-col gap-2 pb-24 pt-2">
        <div v-for="(item, index) in dailySchedule" :key="index" 
             @click="$emit('scrollToTask', index)"
             @dblclick="$emit('edit-task', index)"
             class="flex items-center gap-3 p-3 mx-1 rounded-lg transition-all cursor-pointer group"
             :class="item.completed ? 'opacity-50' : 'hover:bg-zinc-50'">
          
          <div @click.stop @dblclick.stop>
            <Checkbox 
              :checked="item.completed" 
              @update:checked="handleToggleComplete(item)"
              class="shrink-0 w-5 h-5 rounded-md"
            />
          </div>

          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <div class="flex items-center justify-between gap-2 w-full">
              <h4 class="text-sm font-semibold tracking-tight truncate transition-all"
                :class="item.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground group-hover:text-foreground'"
              >
                {{ item.title }}
              </h4>
              <div 
                class="opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer group-hover:opacity-100 hover:bg-zinc-200/50"
                @click.stop="$emit('edit-task', index)"
              >
                <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- 侧边栏底部统计和添加按钮 -->
    <footer class="p-6 border-t border-border/10 bg-transparent relative z-10 flex flex-col gap-4">
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">任务完成度</span>
          <span class="text-[10px] font-bold text-primary">{{ Math.round((dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)) }}%</span>
        </div>
        <Progress :model-value="(dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)" class="h-1 shadow-none" />
      </div>
      <Button 
        class="w-full gap-2 h-9 text-xs font-semibold"
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
import { Plus, Settings2, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useResizable } from '@/composables/useResizable'
import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'
import { useDayData } from '@/views/day/composables/useDayData'

const props = defineProps({
  isMobile: Boolean,
  show: Boolean,
  isLoading: {
    type: Boolean,
    default: false
  }
})

const dateStore = useDateStore()
const { dailySchedule, completedCount, handleToggleComplete } = useDayData()
const { width, startResize, isResizing } = useResizable()

const selectedDay = computed(() => dateStore.currentDate.getDate())
const selectedMonthName = computed(() => getMonthName(dateStore.currentDate.getMonth() + 1, 'full'))

defineEmits(['scrollToTask', 'add-event', 'edit-task', 'close'])
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
