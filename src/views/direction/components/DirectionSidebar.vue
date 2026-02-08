<script setup>
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'

defineProps({
  categorizedGoals: {
    type: Array,
    required: true
  },
  selectedGoalName: {
    type: String,
    default: ''
  }
})

import { useResizable } from '@/composables/useResizable'
const { width, startResize, isResizing } = useResizable()

defineEmits(['select-goal', 'add-goal'])
</script>

<template>
  <aside 
    class="border-r border-zinc-100 flex flex-col z-20 bg-background relative overflow-hidden h-full shrink-0 group/sidebar"
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
        <h2 class="text-2xl font-semibold tracking-tight">所向目标</h2>
        <p class="text-xs text-muted-foreground italic">知所向，行致远</p>
      </div>
    </header>

    <ScrollArea class="flex-1 px-4 relative z-10 no-scrollbar">
      <div class="flex flex-col gap-8 pb-24 pt-2">
        <div v-for="group in categorizedGoals" :key="group.category">
          <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 pl-1">
            {{ group.category === 'Main' ? '主攻方向' : '支线领域' }}
          </p>
          <div class="flex flex-col gap-2">
            <button v-for="(goal, idx) in group.items" :key="goal.name"
                 @click="$emit('select-goal', goal)"
                 class="flex flex-col items-start gap-1 p-3 rounded-lg transition-all text-left group"
                 :class="selectedGoalName === goal.name ? 'bg-secondary ring-1 ring-border shadow-sm' : 'hover:bg-zinc-50'"
            >
              <div class="flex items-center gap-3 w-full">
                <span class="text-[10px] font-mono font-bold text-muted-foreground">0{{ idx + 1 }}</span>
                <h4 class="text-sm font-semibold tracking-tight transition-colors"
                  :class="selectedGoalName === goal.name ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'"
                >
                  {{ goal.name }}
                </h4>
              </div>
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>
    
    <footer class="p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10">
      <div class="w-full flex flex-col gap-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">系统推进负载</span>
          <span class="text-[10px] font-bold text-primary">65%</span>
        </div>
        <Progress :model-value="65" class="h-1" />
        <Button 
          class="w-full gap-2 h-9 text-xs font-semibold"
          @click="$emit('add-goal')"
        >
          <Plus class="w-4 h-4" />
          添加目标
        </Button>
      </div>
    </footer>
  </aside>
</template>
