<script setup>
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'

const props = defineProps({
  selectedGoal: {
    type: Object,
    default: () => ({ name: '', startMonth: 1, endMonth: 1 })
  },
  months: {
    type: Array,
    required: true
  },
  activePicker: {
    type: String,
    default: 'start'
  }
})

const emit = defineEmits(['update:activePicker', 'update-range'])

const startMonth = computed(() => props.selectedGoal?.startMonth ?? 1)
const endMonth = computed(() => props.selectedGoal?.endMonth ?? 1)
const selectedGoalName = computed(() => props.selectedGoal?.name ?? '')

const isMonthActive = (m) => startMonth.value === m || endMonth.value === m
const isWithinRange = (m) => m >= startMonth.value && m <= endMonth.value
</script>

<template>
  <header class="p-6 md:p-10 flex flex-col gap-6">
      <div class="flex flex-col gap-1">
      <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">当前关注</span>
      <h2 class="text-3xl font-bold tracking-tight">{{ selectedGoalName }}</h2>
    </div>

    <Card class="border shadow-sm rounded-xl overflow-hidden bg-background">
      <CardContent class="p-6 flex flex-col gap-8">
        <div class="flex items-center justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">执行时轴</span>
            <div class="flex items-baseline gap-2">
              <span class="text-2xl font-bold tracking-tight">{{ months[startMonth-1].label }}</span>
              <span class="text-xs text-muted-foreground font-medium">到</span>
              <span class="text-2xl font-bold tracking-tight">{{ months[endMonth-1].label }}</span>
            </div>
          </div>
          <div class="flex bg-secondary p-1 rounded-lg border">
            <button 
              @click="emit('update:activePicker', 'start')" 
              class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0"
              :class="activePicker === 'start' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
            >开始月份</button>
            <button 
              @click="emit('update:activePicker', 'end')" 
              class="px-4 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0"
              :class="activePicker === 'end' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
            >结束月份</button>
          </div>
        </div>

        <div class="relative px-2 py-4">
          <div class="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-secondary rounded-full"></div>
          <div class="absolute top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-700 rounded-full"
            :style="{ left: `${((startMonth - 1) / 11) * 100}%`, width: `${((endMonth - startMonth) / 11) * 100}%` }">
          </div>
          <div class="relative flex justify-between">
            <div v-for="m in 12" :key="m" @click="emit('update-range', m)" class="flex flex-col items-center group cursor-pointer">
              <span class="text-[10px] font-mono font-bold mb-4 transition-all" :class="isWithinRange(m) || isMonthActive(m) ? 'text-foreground' : 'text-muted-foreground/30 group-hover:text-muted-foreground'">{{ String(m).padStart(2, '0') }}</span>
              <div class="w-4 h-4 rounded-full flex items-center justify-center z-10 transition-all" :class="isMonthActive(m) ? 'bg-primary scale-125' : 'bg-background border'">
                <div class="w-1.5 h-1.5 rounded-full" :class="isMonthActive(m) ? 'bg-primary-foreground' : isWithinRange(m) ? 'bg-primary/50' : 'bg-muted group-hover:bg-muted-foreground/50'"></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </header>
</template>
