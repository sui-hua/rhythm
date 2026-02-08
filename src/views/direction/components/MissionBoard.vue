<script setup>
import { ChevronDown, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

defineProps({
  activeMonthRange: {
    type: Array,
    required: true
  },
  selectedMonth: {
    type: Number,
    default: null
  },
  monthlyMainGoals: {
    type: Object,
    required: true
  },
  goalKey: {
    type: Function,
    required: true
  },
  selectedDates: {
    type: Object,
    required: true
  },
  hasTask: {
    type: Function,
    required: true
  },
  isSelected: {
    type: Function,
    required: true
  },
  batchInput: {
    type: String,
    default: ''
  }
})

defineEmits([
  'toggle-month', 
  'update:batchInput', 
  'apply-batch', 
  'deselect-all', 
  'start-selection', 
  'enter-selection', 
  'end-selection'
])
</script>

<template>
  <div class="pb-32 px-6 md:px-10" @mouseup="$emit('end-selection')">
    <TransitionGroup name="list">
      <Card v-for="m in activeMonthRange" :key="m"
           class="mb-4 rounded-xl transition-all duration-300 overflow-hidden border shadow-sm"
           :class="selectedMonth === m ? 'ring-1 ring-primary' : 'hover:bg-accent/30'">
        
        <!-- Month Header -->
        <div @click="$emit('toggle-month', m)" 
             class="px-6 py-4 cursor-pointer flex items-center justify-between bg-zinc-50/30 transition-colors hover:bg-zinc-100/50">
          <div class="flex items-center gap-6 flex-1 min-w-0">
            <span class="text-sm font-mono font-bold text-muted-foreground shrink-0">0{{ m }}月</span>
            
            <div class="flex-1 min-w-0 max-w-xl">
              <div v-if="selectedMonth === m" @click.stop class="mb-1">
                <Input 
                  :model-value="monthlyMainGoals[goalKey(m)]"
                  @update:model-value="monthlyMainGoals[goalKey(m)] = $event"
                  class="bg-background text-lg font-semibold tracking-tight h-10 shadow-sm w-full"
                  placeholder="点此分配本月主要任务..." 
                />
              </div>
              <h3 v-else class="text-xl font-bold tracking-tight truncate transition-all" 
                  :class="monthlyMainGoals[goalKey(m)] ? 'text-foreground' : 'text-muted-foreground/30'">
                {{ monthlyMainGoals[goalKey(m)] || '暂无计划' }}
              </h3>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <Button variant="ghost" size="sm" 
                    class="h-7 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-primary hidden md:flex" 
                    @click.stop="$emit('toggle-month', m)">
              {{ selectedMonth === m ? '收起面板' : '展开规划' }}
            </Button>
            <ChevronDown :size="18" class="text-muted-foreground/40 transition-transform duration-300 shrink-0" 
                         :class="{ 'rotate-180 text-primary': selectedMonth === m }" />
          </div>
        </div>

        <!-- Expandable Content -->
        <div v-if="selectedMonth === m" class="p-6 space-y-8 animate-in slide-in-from-top-2 border-t bg-background/50">
          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-2" @mousedown.stop @mouseleave="$emit('end-selection')">
            <div v-for="day in 31" :key="day" 
                 @mousedown="$emit('start-selection', day)" 
                 @mouseenter="$emit('enter-selection', day)"
                 class="aspect-square md:h-10 rounded-md border flex items-center justify-center cursor-pointer transition-all select-none text-[10px] font-bold relative"
                 :class="[
                   isSelected(m, day) ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 
                   hasTask(m, day) ? 'bg-secondary border-transparent text-secondary-foreground' : 
                   'bg-background border-border text-muted-foreground hover:border-primary/50'
                 ]">
              {{ day }}
              <div v-if="hasTask(m, day)" class="absolute bottom-1 w-1 h-1 rounded-full" 
                   :class="isSelected(m, day) ? 'bg-primary-foreground' : 'bg-primary'"></div>
            </div>
          </div>

          <!-- Batch Control -->
          <Transition name="popover">
            <div v-if="selectedDates[m]?.length > 0" 
                 class="bg-foreground text-background rounded-xl p-3 flex items-center gap-3 shadow-xl">
              <div class="px-4 border-r border-background/20 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                {{ selectedDates[m].length }} 天选中
              </div>
              <Input 
                :model-value="batchInput" 
                @update:model-value="$emit('update:batchInput', $event)" 
                @keyup.enter="$emit('apply-batch')" 
                class="flex-1 bg-background text-foreground h-9 shadow-sm" 
                placeholder="批量输入任务内容..." 
              />
              <div class="flex items-center gap-1">
                <Button @click="$emit('apply-batch')" variant="secondary" size="sm" class="h-9 font-bold text-[10px] px-4 rounded-lg">应用</Button>
                <Button variant="ghost" size="icon" @click="$emit('deselect-all')" class="h-9 w-9 text-background/50 hover:text-background hover:bg-background/10 rounded-lg">
                  <X :size="14" />
                </Button>
              </div>
            </div>
          </Transition>
        </div>
      </Card>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.popover-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.popover-enter-from { opacity: 0; transform: translateY(20px) scale(0.9); }
.list-enter-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.list-enter-from { opacity: 0; transform: translateY(30px); }
</style>
