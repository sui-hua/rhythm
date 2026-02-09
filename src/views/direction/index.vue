<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">

    <DirectionSidebar 
      :categorized-goals="categorizedGoals"
      :selected-goal-name="selectedGoal?.name"
      @select-goal="selectGoal"
      @add-goal="handleAddClick"
      @edit-goal="handleEditGoal"
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

    <AddGoalModal 
      v-model:show="showAddModal"
      :initial-data="editingGoal"
      @add="handleAddGoal"
      @update="handleUpdateGoal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'

// Sub-components
import DirectionSidebar from './components/DirectionSidebar.vue'
import GoalRangePicker from './components/GoalRangePicker.vue'
import MissionBoard from './components/MissionBoard.vue'
import MissionArchive from './components/MissionArchive.vue'
import AddGoalModal from './components/AddGoalModal.vue'

import { useAuthStore } from '@/stores/authStore'

const months = [
  { label: '一月', value: 1, full: '一月 (January)' }, 
  { label: '二月', value: 2, full: '二月 (February)' },
  { label: '三月', value: 3, full: '三月 (March)' }, 
  { label: '四月', value: 4, full: '四月 (April)' },
  { label: '五月', value: 5, full: '五月 (May)' }, 
  { label: '六月', value: 6, full: '六月 (June)' },
  { label: '七月', value: 7, full: '七月 (July)' }, 
  { label: '八月', value: 8, full: '八月 (August)' },
  { label: '九月', value: 9, full: '九月 (September)' }, 
  { label: '十月', value: 10, full: '十月 (October)' },
  { label: '十一月', value: 11, full: '十一月 (November)' }, { label: '十二月', value: 12, full: '十二月 (December)' }
]

import { onMounted } from 'vue'
import { db } from '@/services/database'

const authStore = useAuthStore()
const plans = ref([])
const monthlyPlans = ref([])

const fetchData = async () => {
  try {
    plans.value = await db.plans.list()
    console.log(plans.value)
    const allMonthlyPlans = []
    for (const plan of plans.value) {
        const mps = await db.monthlyPlans.list(plan.id)
        allMonthlyPlans.push(...mps)
    }
    monthlyPlans.value = allMonthlyPlans
    
    // Populate monthlyMainGoals
    for (const mp of monthlyPlans.value) {
        if (!mp.month || !mp.plan_id) continue
        const m = new Date(mp.month).getMonth() + 1
        const key = `plan-${mp.plan_id}-${m}`
        monthlyMainGoals[key] = mp.title
    }
    
    // Initialize or refresh selection
    if (selectedGoal.value) {
      const currentId = selectedGoal.value.plan_id
      let found = null
      for (const cat of categorizedGoals.value) {
        found = cat.items.find(item => item.plan_id === currentId)
        if (found) break
      }
      if (found) {
        selectedGoal.value = found
      } else {
        // Fallback if current goal disappeared
         if (categorizedGoals.value.length > 0 && categorizedGoals.value[0].items.length > 0) {
           selectedGoal.value = categorizedGoals.value[0].items[0]
         } else {
           selectedGoal.value = null
         }
      }
    } else if (categorizedGoals.value.length > 0 && categorizedGoals.value[0].items.length > 0) {
      selectedGoal.value = categorizedGoals.value[0].items[0]
    }
  } catch (e) {
    console.error('Failed to fetch direction data', e)
  }
}

onMounted(fetchData)

const categorizedGoals = computed(() => {
  // Group monthly plans by their parent plan's category (plans[].category)
  const map = new Map()
  for (const plan of plans.value) {
    const category = plan.category || '未分类'
    if (!map.has(category)) map.set(category, [])

    const mps = monthlyPlans.value.filter(mp => mp.plan_id === plan.id)
    
    // Calculate range
    let minMonth = 1
    let maxMonth = 12
    
    if (mps.length > 0) {
       const months = mps.map(mp => mp.month ? new Date(mp.month).getMonth() + 1 : null).filter(m => m !== null)
       if (months.length > 0) {
         minMonth = Math.min(...months)
         maxMonth = Math.max(...months)
       }
    }

    map.get(category).push({
      ...plan,
      name: plan.title,
      startMonth: minMonth,
      endMonth: maxMonth,
      plan_id: plan.id
    })
  }
  return Array.from(map.entries()).map(([category, items]) => ({ category, items }))
})

const selectedGoal = ref(null)
const editingGoal = ref(null)

const selectedMonth = ref(null)
const activePicker = ref('start')
const isSelecting = ref(false)
const showAddModal = ref(false)

watch(showAddModal, (val) => {
  if (!val) {
    setTimeout(() => { editingGoal.value = null }, 300) // Delay clearing to avoid UI flicker during transition
  }
})

const monthlyMainGoals = reactive({})
const dailyTasks = reactive({})
const selectedDates = reactive({})
const batchInput = ref('')

const handleAddClick = () => {
  editingGoal.value = null
  showAddModal.value = true
}

const handleEditGoal = (goal) => {
  // Find all monthly plans for this plan_id to determine range
  const relatedMonthlyPlans = monthlyPlans.value.filter(mp => mp.plan_id === goal.plan_id)
  
  // Calculate min and max month
  let minMonth = 12
  let maxMonth = 1
  
  if (relatedMonthlyPlans.length > 0) {
    const months = relatedMonthlyPlans.map(mp => {
      return mp.month ? new Date(mp.month).getMonth() + 1 : null
    }).filter(m => m !== null)
    
    if (months.length > 0) {
      minMonth = Math.min(...months)
      maxMonth = Math.max(...months)
    } else {
      // Fallback if no valid months found (shouldn't happen)
      minMonth = goal.startMonth
      maxMonth = goal.endMonth
    }
  } else {
    // Fallback if no related plans found
    minMonth = goal.startMonth
    maxMonth = goal.endMonth
  }

  editingGoal.value = {
    ...goal,
    startMonth: minMonth,
    endMonth: maxMonth
  }
  showAddModal.value = true
}

const handleUpdateGoal = async (updatedGoal) => {
  if (!editingGoal.value) return
  
  try {
    const goal = editingGoal.value
    const planId = goal.plan_id
    const year = new Date().getFullYear()
    
    // Update Parent Plan (Category & Title)
    if (planId) {
      await db.plans.update(planId, {
        title: updatedGoal.title,
        category: updatedGoal.category
      })
    }
    
    // Get all existing monthly plans for this plan
    const existingMonthlyPlans = monthlyPlans.value.filter(mp => mp.plan_id === planId)
    const existingMonths = existingMonthlyPlans.map(mp => {
      const d = new Date(mp.month)
      return d.getMonth() + 1
    })
    
    // Determine new range
    const startM = updatedGoal.startMonth || 1
    const endM = updatedGoal.endMonth || startM
    const targetMonths = []
    for (let m = startM; m <= endM; m++) targetMonths.push(m)
    
    // 1. Create missing months
    const createPromises = []
    for (const m of targetMonths) {
      if (!existingMonths.includes(m)) {
        const monthDate = new Date(year, m - 1, 1)
        createPromises.push(db.monthlyPlans.create({
          plan_id: planId,
          user_id: authStore.userId,
          title: updatedGoal.title,
          description: goal.description || '', // Preserve description from original goal if possible, or updatedGoal description if we had it
          month: `${year}-${String(m).padStart(2, '0')}-01`,
          status: 'active',
          priority: 2,
        }))
      }
    }
    
    // 2. Update existing months (title sync)
    // We update ALL existing monthly plans for this plan_id to keep titles consistent
    const updatePromises = existingMonthlyPlans.map(mp => 
      db.monthlyPlans.update(mp.id, { title: updatedGoal.title })
    )
    
    // 3. Delete months that are no longer in range?
    // User instruction: "修改单个月份 是单独的功能" implies this is a "Global Edit".
    // If I change range from Jan-Mar to Feb-Mar, Jan should probably be removed from this Plan.
    // However, deleting data is risky. But if we don't delete, the "Edit Range" doesn't fully work (Jan still exists).
    // Let's assume we SHOULD delete months outside the new range to honor the "Range" setting.
    // Filter existing plans that are NOT in targetMonths
    const toDelete = existingMonthlyPlans.filter(mp => {
      const m = new Date(mp.month).getMonth() + 1
      return !targetMonths.includes(m)
    })
    
    const deletePromises = toDelete.map(mp => db.monthlyPlans.delete(mp.id))
    
    await Promise.all([...createPromises, ...updatePromises, ...deletePromises])
    
    await fetchData()
    showAddModal.value = false
  } catch (e) {
    console.error('Update goal failed:', e)
  }
}

const handleAddGoal = async (newGoal) => {
  try {
    console.log('Adding goal, authStore.userId:', authStore.userId)
    
    if (!authStore.userId) {
      console.error('User ID not available')
      return
    }
    
    const year = new Date().getFullYear()
    // Use startMonth/endMonth for range
    const startM = newGoal.startMonth || 1
    const endM = newGoal.endMonth || startM
    
    // Step 1: Create parent plan (总目标)
    const planData = {
      user_id: authStore.userId,
      title: newGoal.title,
      description: newGoal.description || '',
      year: `${year}-01-01`,
      category: newGoal.category || '',
      status: 'active',
      priority: 2,
    }
    
    console.log('Creating parent plan with data:', planData)
    const createdPlan = await db.plans.create(planData)
    console.log('Parent plan created:', createdPlan)
    
    // Step 2: Create monthly plans for range
    const promises = []
    for (let m = startM; m <= endM; m++) {
      const monthlyPlanData = {
        plan_id: createdPlan.id,
        user_id: authStore.userId,
        title: newGoal.title,
        description: newGoal.description || '',
        month: `${year}-${String(m).padStart(2, '0')}-01`,
        status: 'active',
        priority: 2,
      }
      promises.push(db.monthlyPlans.create(monthlyPlanData))
    }

    console.log(`Creating ${promises.length} monthly plans`)
    await Promise.all(promises)
    console.log('Monthly plans created successfully')
    
    await fetchData()
    showAddModal.value = false
  } catch (e) {
    console.error('Add goal failed:', e)
  }
}

const goalKey = (m) => {
  if (!selectedGoal.value) return `undefined-${m}`
  return `plan-${selectedGoal.value.plan_id}-${m}`
}
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

const isWithinRange = (m) => selectedGoal.value ? (m >= selectedGoal.value.startMonth && m <= selectedGoal.value.endMonth) : false
const activeMonthRange = computed(() => {
  if (!selectedGoal.value) return []
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