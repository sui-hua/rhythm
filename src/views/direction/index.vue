<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">

    <DirectionSidebar 
      :categorized-goals="categorizedGoals"
      :selected-goal-name="selectedGoal.name"
      @select-goal="selectGoal"
    />

    <div class="flex-1 bg-zinc-50/50 relative overflow-hidden flex flex-col">
      <div class="w-full h-full flex p-0 overflow-auto relative z-10 no-scrollbar">
        <ScrollArea class="w-full max-w-[600px] border-r border-border bg-background relative z-20">
          <GoalRangePicker 
            v-model:active-picker="activePicker"
            :selected-goal="selectedGoal"
            :months="months"
            @update-range="updateRange"
          />

          <MissionBoard 
            :active-month-range="activeMonthRange"
            :selected-month="selectedMonth"
            :monthly-main-goals="monthlyMainGoals"
            :goal-key="goalKey"
            :selected-dates="selectedDates"
            :has-task="hasTask"
            :is-selected="isSelected"
            v-model:batch-input="batchInput"
            @toggle-month="toggleMonth"
            @apply-batch="applyBatchTask"
            @deselect-all="deselectAllInMonth"
            @start-selection="startSelection"
            @enter-selection="handleMouseEnter"
            @end-selection="endSelection"
          />
        </ScrollArea>

      <MissionArchive 
        :selected-month="selectedMonth"
        :months="months"
        :sorted-selected-dates="sortedSelectedDates"
        :daily-tasks="dailyTasks"
        :day-task-key="dayTaskKey"
        class="flex-1 relative z-10"
      />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'

// Sub-components
import DirectionSidebar from './components/DirectionSidebar.vue'
import GoalRangePicker from './components/GoalRangePicker.vue'
import MissionBoard from './components/MissionBoard.vue'
import MissionArchive from './components/MissionArchive.vue'

const months = [
  { label: '一月', value: 1, full: '一月 (January)' }, { label: '二月', value: 2, full: '二月 (February)' },
  { label: '三月', value: 3, full: '三月 (March)' }, { label: '四月', value: 4, full: '四月 (April)' },
  { label: '五月', value: 5, full: '五月 (May)' }, { label: '六月', value: 6, full: '六月 (June)' },
  { label: '七月', value: 7, full: '七月 (July)' }, { label: '八月', value: 8, full: '八月 (August)' },
  { label: '九月', value: 9, full: '九月 (September)' }, { label: '十月', value: 10, full: '十月 (October)' },
  { label: '十一月', value: 11, full: '十一月 (November)' }, { label: '十二月', value: 12, full: '十二月 (December)' }
]

import { mockDb } from '@/services/mockDb'

const categorizedGoals = computed(() => {
  return mockDb.plans.value.map(plan => {
    const items = mockDb.monthlyPlans.value
      .filter(mp => mp.plan_id === plan.id)
      .map(mp => ({
        ...mp,
        name: mp.title,
        startMonth: mp.start_month,
        endMonth: mp.end_month
      }))
    
    return {
      category: plan.title,
      items
    }
  })
})

const selectedGoal = ref(null)

// Initialize selection
if (categorizedGoals.value.length > 0 && categorizedGoals.value[0].items.length > 0) {
  selectedGoal.value = categorizedGoals.value[0].items[0]
}
const selectedMonth = ref(null)
const activePicker = ref('start')
const isSelecting = ref(false)

const monthlyMainGoals = reactive({})
const dailyTasks = reactive({})
const selectedDates = reactive({})
const batchInput = ref('')

const goalKey = (m) => `${selectedGoal.value.name}-${m}`
const dayTaskKey = (day) => `${goalKey(selectedMonth.value)}-${day}`

const updateRange = (m) => {
  if (activePicker.value === 'start') {
    if (m > selectedGoal.value.endMonth) selectedGoal.value.endMonth = m
    selectedGoal.value.startMonth = m; activePicker.value = 'end'
  } else {
    if (m < selectedGoal.value.startMonth) selectedGoal.value.startMonth = m
    selectedGoal.value.endMonth = m; activePicker.value = 'start'
  }
}

const isWithinRange = (m) => m >= selectedGoal.value.startMonth && m <= selectedGoal.value.endMonth
const activeMonthRange = computed(() => {
  let r = []; for (let i = selectedGoal.value.startMonth; i <= selectedGoal.value.endMonth; i++) r.push(i); return r
})

const isSelected = (m, day) => selectedDates[m]?.includes(day)
const hasTask = (m, day) => !!dailyTasks[`${selectedGoal.value.name}-${m}-${day}`]

const startSelection = (day) => {
  isSelecting.value = true
  const m = selectedMonth.value
  if (!selectedDates[m]) selectedDates[m] = []
  const idx = selectedDates[m].indexOf(day)
  idx > -1 ? selectedDates[m].splice(idx, 1) : selectedDates[m].push(day)
}

const handleMouseEnter = (day) => {
  if (isSelecting.value) {
    const m = selectedMonth.value
    if (!selectedDates[m].includes(day)) selectedDates[m].push(day)
  }
}

const endSelection = () => isSelecting.value = false

const applyBatchTask = () => {
  const m = selectedMonth.value
  if (!m || !batchInput.value.trim()) return
  selectedDates[m].forEach(day => { dailyTasks[dayTaskKey(day)] = batchInput.value })
  batchInput.value = ''
}

const deselectAllInMonth = () => selectedDates[selectedMonth.value] = []
const toggleMonth = (m) => { selectedMonth.value = selectedMonth.value === m ? null : m; if (selectedMonth.value && !selectedDates[m]) selectedDates[m] = [] }
const sortedSelectedDates = computed(() => (selectedDates[selectedMonth.value] || []).sort((a,b)=>a-b))
const selectGoal = (g) => { selectedGoal.value = g; selectedMonth.value = null }
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>