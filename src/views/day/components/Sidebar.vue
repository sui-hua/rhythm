<template>
  <aside 
    class="border-r border-zinc-100 flex flex-col z-20 bg-background relative overflow-hidden group/sidebar"
    :style="{ width: width + 'px' }"
  >
    <!-- Resize Handle -->
    <div 
      class="absolute right-0 top-0 bottom-0 w-1 hover:bg-primary/10 cursor-col-resize z-50 transition-colors opacity-0 group-hover/sidebar:opacity-100"
      :class="{ 'bg-primary/20 opacity-100': isResizing }"
      @mousedown="startResize"
    ></div>

    <header class="px-6 pt-10 pb-6 shrink-0 border-b border-border mb-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-semibold tracking-tight">{{ selectedDay }}日</h2>
        <p class="text-xs text-muted-foreground">{{ selectedMonth.full }} 任务清单</p>
      </div>
    </header>

    <ScrollArea class="flex-1 px-4 relative z-10 no-scrollbar">
      <div class="flex flex-col gap-2 pb-24 pt-2">
        <div v-for="(item, index) in dailySchedule" :key="index" 
             @click="$emit('scrollToTask', index)"
             @dblclick="$emit('edit-task', index)"
             class="flex items-center gap-3 p-3 rounded-lg transition-all group cursor-pointer"
             :class="[item.completed ? 'opacity-50' : 'hover:bg-zinc-50']">
          
          <div @click.stop @dblclick.stop>
            <Checkbox 
              :checked="item.completed" 
              @update:checked="$emit('toggleComplete', index)"
              class="shrink-0 w-5 h-5 rounded-md"
            />
          </div>

          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span class="text-[10px] font-mono font-medium text-muted-foreground">{{ item.time }}</span>
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-sm font-semibold tracking-tight truncate transition-all" :class="{ 'line-through text-muted-foreground': item.completed }">
                {{ item.title }}
              </h4>
              <Pencil class="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>

    <footer class="p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10 flex flex-col gap-4">
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">任务完成度</span>
          <span class="text-[10px] font-bold text-primary">{{ Math.round((dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)) }}%</span>
        </div>
        <Progress :model-value="(dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)" class="h-1 shadow-none" />
      </div>
      <Button 
        class="w-full gap-2 h-9 text-xs font-semibold"
        @click="$emit('addEvent')"
      >
        <Plus class="w-4 h-4" />
        添加项目
      </Button>
    </footer>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Pencil } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useResizable } from '@/composables/useResizable'

const props = defineProps({
  selectedDay: Number,
  selectedMonth: Object,
  dailySchedule: Array,
  completedCount: Number
})

const { width, startResize, isResizing } = useResizable()

defineEmits(['goBack', 'scrollToTask', 'toggleComplete', 'addEvent', 'edit-task'])
</script>