<script setup>
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

defineProps({
  habits: {
    type: Array,
    required: true
  },
  selectedHabitId: {
    type: Number,
    default: null
  }
})

import { useResizable } from '@/composables/useResizable'
const { width, startResize, isResizing } = useResizable()

defineEmits(['select-habit', 'back', 'add-habit'])
</script>

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
        <h2 class="text-2xl font-semibold tracking-tight">习惯养成</h2>
        <p class="text-xs text-muted-foreground italic">自律即自由</p>
      </div>
    </header>

    <ScrollArea class="flex-1 px-4 relative z-10 no-scrollbar">
      <div class="flex flex-col gap-2 pb-24 pt-2">
        <button 
          v-for="habit in habits" 
          :key="habit.id"
          @click="$emit('select-habit', habit)"
          class="flex flex-col items-start gap-1 p-3 rounded-lg transition-all text-left"
          :class="selectedHabitId === habit.id ? 'bg-secondary ring-1 ring-border shadow-sm' : 'hover:bg-zinc-50'"
        >
          <h4 class="text-sm font-semibold tracking-tight transition-colors"
              :class="selectedHabitId === habit.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'"
          >
            {{ habit.title }}
          </h4>
        </button>
      </div>
    </ScrollArea>

    <footer class="p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10 flex flex-col gap-4">
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">习惯坚持度</span>
          <span class="text-[10px] font-bold text-primary">65%</span>
        </div>
        <Progress :model-value="65" class="h-1" />
      </div>
      <Button 
        class="w-full gap-2 h-9 text-xs font-semibold"
        @click="$emit('add-habit')"
      >
        <Plus class="w-4 h-4" />
        添加项目
      </Button>
    </footer>
  </aside>
</template>
