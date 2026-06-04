<template>
  <aside class="border-r border-zinc-100 flex flex-col z-20 bg-background relative overflow-hidden h-full shrink-0 group/sidebar" :style="{ width: width + 'px' }">
    <div class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-50 transition-colors opacity-0 group-hover/sidebar:opacity-100 hover:bg-primary/10" :class="isResizing ? 'bg-primary/20 !opacity-100' : ''" @mousedown="startResize"></div>

    <header class="px-6 pt-10 pb-6 shrink-0 border-b border-border mb-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-semibold tracking-tight">所向目标</h2>
      </div>
    </header>

    <ScrollArea class="sidebar-scroll flex-1 px-4 relative z-10">
      <div class="flex flex-col gap-8 pb-24 pt-2">
        <div v-for="group in categorizedGoals" :key="group.category" class="flex flex-col gap-2">
          <div class="flex items-center gap-2 mb-4 pl-1">
            <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.02em]">{{ group.category }}</p>
          </div>

          <div class="flex flex-col gap-2">
            <button
              v-for="goal in group.items"
              :key="goal.goal_id"
              class="flex flex-col items-start gap-1 p-3 mx-1 rounded-lg transition-all text-left group/goal hover:bg-zinc-50"
              :class="selectedGoalName === goal.name ? 'bg-secondary ring-1 ring-border shadow-sm' : ''"
              @click="selectGoal(goal)"
              @dblclick="handleEditGoal(goal)"
            >
              <div class="flex items-center justify-between w-full gap-3">
                <h4 class="text-sm font-semibold tracking-tight transition-colors flex-1 truncate group-hover/goal:text-foreground" :class="selectedGoalName === goal.name ? 'text-foreground' : 'text-muted-foreground'">
                  {{ goal.name }}
                </h4>
                <div class="opacity-0 transition-opacity p-1 rounded flex items-center justify-center shrink-0 cursor-pointer hover:bg-zinc-200/50 group-hover/goal:opacity-100" @click.stop="handleEditGoal(goal)">
                  <Settings2 class="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </ScrollArea>

    <footer class="p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10">
      <div class="w-full flex flex-col gap-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">本月进度</span>
          <span class="text-[10px] font-bold text-primary">{{ systemLoad }}%</span>
        </div>
        <Progress :model-value="systemLoad" class="h-1" />
        <Button class="w-full gap-2 h-9 text-xs font-semibold" @click="handleAddClick">
          <Plus class="w-4 h-4" />
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
import { useDirectionStore } from '@/stores/directionStore'
import { computed } from 'vue'
import { Plus, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { useResizable } from '@/composables/useResizable'
import { isGoalDayCompleted } from '@/utils/goalDayStatus'
import { getDirectionMonthlyProgress } from '@/views/direction/utils/progress'

const store = useDirectionStore()
const { categorizedGoals } = useDirectionFetch()
const { selectedGoal, selectGoal, selectedMonth } = useDirectionSelection()
const { handleAddClick, handleEditGoal } = useDirectionGoals()
const selectedGoalName = computed(() => selectedGoal.value?.name || '')

// 计算系统推进负载：基于选中目标当前月份的日计划完成率
const systemLoad = computed(() => {
  if (!selectedGoal.value || !selectedMonth.value) return 0

  const goalId = selectedGoal.value.goal_id
  const month = selectedMonth.value

  return getDirectionMonthlyProgress({
    dailyTasks: store.dailyTasks,
    goalId,
    month,
    isGoalDayCompleted
  })
})

const { width, startResize, isResizing } = useResizable()
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.sidebar-scroll::-webkit-scrollbar { display: none; }
</style>
