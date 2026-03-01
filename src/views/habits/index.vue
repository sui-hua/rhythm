<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">
    
    <HabitSidebar 
      :habits="habits" 
      :selected-habit-id="selectedHabit?.id"
      :today-completion-rate="todayCompletionRate"
      @select-habit="selectedHabit = $event"
      @edit-habit="handleSidebarEdit"
      @add-habit="showAddModal = true"
    />

    <div class="flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col">
      <div v-if="selectedHabit" class="w-full h-full flex flex-col p-6 md:p-10 overflow-auto relative z-10 no-scrollbar">
        
        <div class="max-w-4xl mx-auto w-full flex flex-col gap-6">
          <header class="flex flex-col gap-2 mb-2">
            <h3 class="text-3xl font-bold tracking-tight text-foreground">{{ selectedHabit.title }}</h3>
          </header>

          <HabitStats :stats="habitStats" />

          <HabitCalendar 
            :completed-days="selectedHabit.completedDays"
            @toggle-complete="toggleComplete"
            @month-changed="handleMonthChange"
          />

          <!-- Today Log Card -->
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
      @refresh="fetchHabits"
    />

    <EditHabitModal 
      v-model:show="showEditModal"
      :habitData="selectedHabit"
      @refresh="fetchHabits"
      @deleted="selectedHabit = null"
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

// 用于在日历上查看不同时间刻的月份参数（独立于全局真实时间）
const viewYear = ref(dateStore.currentDate.getFullYear())
const viewMonth = ref(dateStore.currentDate.getMonth())

const handleMonthChange = ({ year, month }) => {
  viewYear.value = year
  viewMonth.value = month
  fetchHabits()
}

const habits = ref([])

const fetchHabits = async () => {
  try {
    const rawHabits = await db.habits.list()
    habits.value = rawHabits.map(h => {
        const logs = h.habit_logs || []
        // Filter logs for view month
        const monthlyLogs = logs.filter(log => {
             const d = new Date(log.completed_at)
             return d.getFullYear() === viewYear.value && d.getMonth() === viewMonth.value
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

const todayCompletionRate = computed(() => {
  if (!habits.value || habits.value.length === 0) return 0
  
  const today = dateStore.currentDate.getDate()
  // 筛选出今天有打卡记录的习惯数
  const completedTodayCount = habits.value.filter(h => {
    return h.monthlyLogs.some(log => new Date(log.completed_at).getDate() === today)
  }).length
  
  return Math.round((completedTodayCount / habits.value.length) * 100)
})

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


const habitStats = computed(() => {
  if (!selectedHabit.value) return []
  return [
    { label: '本月打卡', value: selectedHabit.value.completedDays.length, unit: '天' },
    { label: '年度总计', value: selectedHabit.value.total, unit: '天' },
    { label: '周期完成率', value: selectedHabit.value.completionRate, unit: '%' },
    { label: '当前连击', value: selectedHabit.value.streak, unit: '天' }
  ]
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
          // 只允许打卡记录当前日历选中的那年、那月、那天，否则可能导致紊乱
          const date = new Date(viewYear.value, viewMonth.value, day, 12, 0, 0)
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
      const date = new Date(dateStore.currentDate.getFullYear(), dateStore.currentDate.getMonth(), today, 12, 0, 0)
      await db.habits.log(selectedHabit.value.id, habitNote.value.trim(), date.toISOString())
    }
    
    // Clear input and refresh
    habitNote.value = ''
    await fetchHabits()
  } catch (e) {
    console.error('Quick log failed', e)
  }
}


</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>