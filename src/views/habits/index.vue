<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    
    <HabitSidebar 
      :habits="habits" 
      :selected-habit-id="selectedHabit?.id"
      @select-habit="selectedHabit = $event"
      @add-habit="showAddModal = true"
      @back="goBack"
    />

    <div class="flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col">
      <div v-if="selectedHabit" class="w-full h-full flex flex-col p-6 md:p-10 overflow-auto relative z-10 no-scrollbar">
        
        <div class="max-w-4xl mx-auto w-full flex flex-col gap-6">
          <header class="flex flex-col gap-2 mb-2">
            <h3 class="text-3xl font-bold tracking-tight text-foreground">{{ selectedHabit.title }}</h3>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>2026年度计划</span>
              <span class="w-1 h-1 rounded-full bg-border" />
              <span>坚持就是胜利</span>
            </div>
          </header>

          <HabitStats :stats="habitStats" />

          <HabitCalendar 
            :month-name="'一月'"
            :calendar-grid="calendarGrid"
            :completed-days="selectedHabit.completedDays"
            @toggle-complete="toggleComplete"
          />

          <!-- Quick Log Card -->
          <Card class="border shadow-sm rounded-xl overflow-hidden bg-background">
            <CardContent class="p-4 flex items-center gap-6">
              <div class="shrink-0 flex flex-col border-r pr-6 gap-1">
                <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">今日记录</span>
                <span class="text-sm font-bold tracking-tight">1月26日</span>
              </div>
              <Input 
                placeholder="记录今天的习惯心得..."
                class="flex-1 h-10 border shadow-none focus-visible:ring-1"
              />
              <Button size="icon" class="w-10 h-10 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground">
                <ArrowUpRight class="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
          
          <HabitLogs />
        </div>
      </div>
    </div>

    <AddHabitModal 
      v-model:show="showAddModal"
      @add="handleAddHabit"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'vue-router'

// Sub-components
import HabitSidebar from './components/HabitSidebar.vue'
import HabitStats from './components/HabitStats.vue'
import HabitCalendar from './components/HabitCalendar.vue'
import HabitLogs from './components/HabitLogs.vue'
import AddHabitModal from './components/AddHabitModal.vue'
import { mockDb } from '@/services/mockDb'

const router = useRouter()
const habits = mockDb.habits

const selectedHabit = ref(habits.value[0])
const showAddModal = ref(false)

const handleAddHabit = (newHabit) => {
  const id = `h${habits.value.length + 1}`
  const habitWithId = { ...newHabit, id, completedDays: [], total: 0, completionRate: 0, streak: 0 }
  habits.value.push(habitWithId)
  selectedHabit.value = habitWithId
  showAddModal.value = false
}

const habitStats = computed(() => [
  { label: '本月打卡', value: selectedHabit.value.completedDays.length, unit: '天' },
  { label: '年度总计', value: selectedHabit.value.total, unit: '天' },
  { label: '周期完成率', value: selectedHabit.value.completionRate, unit: '%' },
  { label: '当前连击', value: selectedHabit.value.streak, unit: '天' }
])

const calendarGrid = computed(() => {
  const year = 2026;
  const month = 0;
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = 31;

  const grid = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(i);
  return grid;
})

const toggleComplete = (day) => {
  const list = selectedHabit.value.completedDays;
  const index = list.indexOf(day);
  if (index > -1) list.splice(index, 1);
  else list.push(day);
}

const goBack = () => {
  router.push('/year')
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>