<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    
    <HabitSidebar 
      :habits="habits" 
      :selected-habit-id="selectedHabit?.id"
      @select-habit="selectedHabit = $event"
      @edit-habit="handleSidebarEdit"
      @add-habit="showAddModal = true"
      @back="goBack"
    />

    <div class="flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col">
      <div v-if="selectedHabit" class="w-full h-full flex flex-col p-6 md:p-10 overflow-auto relative z-10 no-scrollbar">
        
        <div class="max-w-4xl mx-auto w-full flex flex-col gap-6">
          <header class="flex flex-col gap-2 mb-2">
            <h3 class="text-3xl font-bold tracking-tight text-foreground">{{ selectedHabit.title }}</h3>
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{{ dateStore.currentDate.getFullYear() }}年度计划</span>
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
                <span class="text-sm font-bold tracking-tight">{{ getCurrentDate() }}</span>
              </div>
              <Input 
                v-model="habitNote"
                placeholder="记录今天的习惯心得..."
                class="flex-1 h-10 border shadow-none focus-visible:ring-1"
                @keyup.enter="handleQuickLog"
              />
              <Button 
                size="icon" 
                class="w-10 h-10 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all bg-primary text-primary-foreground"
                @click="handleQuickLog"
              >
                <ArrowUpRight class="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
          <HabitLogs :logs="selectedHabit?.logs || []" />
        </div>
      </div>
    </div>

    <AddHabitModal 
      v-model:show="showAddModal"
      @add="handleAddHabit"
    />

    <EditHabitModal 
      v-model:show="showEditModal"
      :habitData="selectedHabit"
      @update="handleUpdateHabit"
      @delete="handleDeleteHabit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowUpRight, Pencil } from 'lucide-vue-next'
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
import EditHabitModal from './components/EditHabitModal.vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { useDateStore } from '@/stores/dateStore'

const router = useRouter()
const authStore = useAuthStore()
const dateStore = useDateStore()
const habits = ref([])

const currentYear = computed(() => dateStore.currentDate.getFullYear())
const currentMonth = computed(() => dateStore.currentDate.getMonth())

const fetchHabits = async () => {
  try {
    const rawHabits = await db.habits.list()
    habits.value = rawHabits.map(h => {
        const logs = h.habit_logs || []
        // Filter logs for current view month
        const monthlyLogs = logs.filter(log => {
             const d = new Date(log.completed_at)
             return d.getFullYear() === currentYear.value && d.getMonth() === currentMonth.value
        })
        
        const completedDays = monthlyLogs.map(log => new Date(log.completed_at).getDate())
        
        return {
            ...h,
            completedDays, 
            logs, // All logs
            monthlyLogs,
            total: logs.length,
            completionRate: Math.round((logs.length / 30) * 100), // Simple calc
            streak: calculateStreak(logs)
        }
    })
    
    if (selectedHabit.value) {
        const updated = habits.value.find(h => h.id === selectedHabit.value.id)
        if (updated) selectedHabit.value = updated
    } else if (habits.value.length > 0) {
        selectedHabit.value = habits.value[0]
    }
  } catch (e) {
      console.error('Fetch habits failed', e)
  }
}

const calculateStreak = (logs) => {
    // Simple streak calc (placeholder)
    return logs.length > 0 ? logs.length : 0
}

onMounted(fetchHabits)

const selectedHabit = ref(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const habitNote = ref('')

const handleSidebarEdit = (habit) => {
  selectedHabit.value = habit
  showEditModal.value = true
}

const getCurrentDate = () => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
}

const handleAddHabit = async (newHabit) => {
  try {
      const userId = authStore.userId
      if (!userId) {
          console.error('User not authenticated')
          return
      }

      await db.habits.create({
          user_id: userId,
          title: newHabit.title,
          frequency: newHabit.frequency || { type: 'daily' },
          target_value: newHabit.target_value || 1,
          archived: false
      })
      await fetchHabits()
      showAddModal.value = false
  } catch (e) {
      console.error('Add habit failed', e)
  }
}

const handleUpdateHabit = async (updatedData) => {
  try {
    await db.habits.update(updatedData.id, {
      title: updatedData.title
    })
    await fetchHabits()
  } catch (e) {
    console.error('Update habit failed', e)
  }
}

const handleDeleteHabit = async (habitId) => {
  try {
    await db.habits.delete(habitId)
    selectedHabit.value = null
    await fetchHabits()
  } catch (e) {
    console.error('Delete habit failed', e)
  }
}

const habitStats = computed(() => {
  if (!selectedHabit.value) return []
  return [
    { label: '本月打卡', value: selectedHabit.value.completedDays.length, unit: '天' },
    { label: '年度总计', value: selectedHabit.value.total, unit: '天' },
    { label: '周期完成率', value: selectedHabit.value.completionRate, unit: '%' },
    { label: '当前连击', value: selectedHabit.value.streak, unit: '天' }
  ]
})

const calendarGrid = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value;
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  for (let i = 1; i <= daysInMonth; i++) grid.push(i);
  return grid;
})

const toggleComplete = async (day) => {
  if (!selectedHabit.value) return
  
  const habit = selectedHabit.value
  const existingLog = habit.monthlyLogs.find(log => {
      return new Date(log.completed_at).getDate() === day
  })
  
  try {
        if (existingLog) {
          await db.habits.deleteLog(existingLog.id)
        } else {
          const date = new Date(currentYear.value, currentMonth.value, day, 12, 0, 0)
          await db.habits.log(habit.id, '', date.toISOString())
        }
      await fetchHabits()
  } catch (e) {
      console.error('Toggle habit log failed', e)
  }
}

const handleQuickLog = async () => {
  if (!selectedHabit.value || !habitNote.value.trim()) {
    console.warn('Habit not selected or note is empty')
    return
  }
  
  try {
    const now = new Date()
    const today = now.getDate()
    
    // Check if log already exists for today
    const existingLog = selectedHabit.value.monthlyLogs.find(log => {
      return new Date(log.completed_at).getDate() === today
    })
    
    if (!existingLog) {
      // Create new log for today
      const date = new Date(currentYear.value, currentMonth.value, today, 12, 0, 0)
      await db.habits.log(selectedHabit.value.id, habitNote.value.trim(), date.toISOString())
    }
    
    // Clear input and refresh
    habitNote.value = ''
    await fetchHabits()
  } catch (e) {
    console.error('Quick log failed', e)
  }
}


const goBack = () => {
  router.push('/year')
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>