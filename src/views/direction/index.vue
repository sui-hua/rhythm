<!--
  Direction/index.vue
  功能：“所向”视图的主入口文件。
  
  架构说明：
  1. 布局：左侧 Sidebar (目标分类)，中间 MissionBoard (月度计划)，右侧 MissionArchive (日任务归档 - 在此布局中位于 MissionBoard 容器内).
  2. 数据流：
     - 从 Supabase 获取 Plans (长期目标) 和 MonthlyPlans (月度计划)。
     - 将数据聚合为 CategorizedGoals 供 Sidebar 使用。
     - 选中 Goal 后，计算其 activeMonthRange 传递给 MissionBoard。
  3. 状态管理：
     - selectedGoal: 当前选中的长期目标。
     - selectedMonth: 当前展开的月份。
     - selectedDates:当前选中的日期集合。
-->
<template>
  <div class="h-screen w-full bg-white flex overflow-hidden font-sans text-black selection:bg-black selection:text-white relative">

    <!-- 左侧导航：目标列表 -->
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
          <!-- 目标月份范围选择器 -->
          <GoalRangePicker 
            :active-picker="activePicker"
            :selected-goal="selectedGoal"
            :months="months"
            @update:activePicker="activePicker = $event"
            @confirm-range="handleConfirmRange"
          />

          <!-- 中间主面板：月度任务视板 -->
          <MissionBoard 
            :active-month-range="activeMonthRange"
            :selected-month="selectedMonth"
            :monthly-main-goals="monthlyMainGoals"
            :goal-key="goalKey"
            :selected-dates="selectedDates"
            :has-task="hasTask"
            :is-selected="isSelected"

            :can-select="canSelect"
            v-model:batch-input="batchInput"
            @toggle-month="toggleMonth"
            @apply-batch="applyBatchTask"
            @deselect-all="deselectAllInMonth"
            @start-selection="startSelection"
            @enter-selection="handleMouseEnter"
            @end-selection="endSelection"
            @delete-batch="handleBatchDelete"
          />
        </ScrollArea>

      <!-- 右侧：任务归档/编辑 -->
      <MissionArchive 
        :selected-month="selectedMonth"
        :months="months"
        :sorted-selected-dates="datesWithTasks"
        :daily-tasks="dailyTasks"
        :day-task-key="dayTaskKey"
        @update-task="handleUpdateTask"
        class="flex-1 relative z-10"
      />
      </div>
    </div>

    <!-- 弹窗：添加/编辑目标 -->
    <AddGoalModal 
      v-model:show="showAddModal"
      :initial-data="editingGoal"
      @add="handleAddGoal"
      @update="handleUpdateGoal"
      @delete="handleDeleteGoal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'

// 子组件引用
import DirectionSidebar from './components/DirectionSidebar.vue'
import GoalRangePicker from './components/GoalRangePicker.vue'
import MissionBoard from './components/MissionBoard.vue'
import MissionArchive from './components/MissionArchive.vue'
import AddGoalModal from './components/AddGoalModal.vue'

import { useAuthStore } from '@/stores/authStore'

import { onMounted } from 'vue'
import { db } from '@/services/database'
import { getMonthName } from '@/utils/dateFormatter'

// 月份常量定义（动态生成）
const months = Array.from({ length: 12 }, (_, i) => ({
  label: getMonthName(i + 1, 'zh'),
  value: i + 1,
  full: getMonthName(i + 1, 'full')
}))

const authStore = useAuthStore()
const plans = ref([])
const monthlyPlans = ref([])

/**
 * 初始化数据加载
 * 功能：
 * 1. 获取所有长期目标 (Plans).
 * 2. 获取每个 Plan 下的 MonthlyPlans.
 * 3. 填充 monthlyMainGoals 状态供视图显示.
 * 4. 自动选中第一个分类的第一个目标（如果有）。
 */
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
    
    // 初始化月度主要目标映射 { "plan-123-1": "Title" }
    for (const mp of monthlyPlans.value) {
        if (!mp.month || !mp.plan_id) continue
        const m = new Date(mp.month).getMonth() + 1
        const key = `plan-${mp.plan_id}-${m}`
        monthlyMainGoals[key] = mp.title
    }
    
    // 4. 加载所有 DailyPlans
    console.log('Fetching daily plans...')
    const allDailyPlans = []
    const mpMap = new Map() // id -> mp
    for (const mp of monthlyPlans.value) {
      mpMap.set(mp.id, mp)
      const dps = await db.dailyPlans.list(mp.id) // Potential performance bottleneck, but okay for now
      allDailyPlans.push(...dps)
    }
    
    // 5. 初始化 dailyTasks
    for (const dp of allDailyPlans) {
      const mp = mpMap.get(dp.monthly_plan_id)
      if (mp) {
        const m = new Date(mp.month).getMonth() + 1
        const d = new Date(dp.date).getDate()
        const key = `plan-${mp.plan_id}-${m}-${d}`
        dailyTasks[key] = dp
      }
    }
    console.log(`Loaded ${allDailyPlans.length} daily plans`)

    // 初始化选中的目标
    if (selectedGoal.value) {
      // 尝试保持当前选中的目标（如果刷新后仍存在）
      const currentId = selectedGoal.value.plan_id
      let found = null
      for (const cat of categorizedGoals.value) {
        found = cat.items.find(item => item.plan_id === currentId)
        if (found) break
      }
      if (found) {
        selectedGoal.value = found
      } else {
        // Fallback: 选中第一个
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

/**
 * 按分类聚合的目标列表
 * 结构：[{ category: '分类名', items: [goal1, goal2] }]
 * 逻辑：
 * 1. 遍历 plans，按 category 分组。
 * 2. 计算每个 plan 的 startMonth 和 endMonth (根据 monthlyPlans)。
 */
const categorizedGoals = computed(() => {
  // 按父计划的分类分组月度计划 (plans[].category)
  const map = new Map()
  for (const plan of plans.value) {
    const category = plan.category || '未分类'
    if (!map.has(category)) map.set(category, [])

    const mps = monthlyPlans.value.filter(mp => mp.plan_id === plan.id)
    
    // 计算月份范围
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
    setTimeout(() => { editingGoal.value = null }, 300) // 延迟清除以避免过渡期间的 UI 闪烁
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

/**
 * 打开编辑弹窗
 * @param {Object} goal - 要编辑的目标对象
 * 功能：计算目标当前的有效月份范围，并填充到 editingGoal 供弹窗使用。
 */
const handleEditGoal = (goal) => {
  // 查找该计划下的所有月度计划以确定范围
  const relatedMonthlyPlans = monthlyPlans.value.filter(mp => mp.plan_id === goal.plan_id)
  
  // 计算最小和最大月份
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
      // 如果未找到有效月份的后备方案 (不应发生)
      minMonth = goal.startMonth
      maxMonth = goal.endMonth
    }
  } else {
    // 如果未找到相关计划的后备方案
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

/**
 * 更新目标（包括标题、分类和月份范围）
 * @param {Object} updatedGoal - 更新后的目标数据
 * 逻辑：
 * 1. 更新总目标 (Plan) 的标题和分类。
 * 2. 根据新的月份范围 (startMonth - endMonth):
 *    - 创建范围内缺失的 MonthlyPlans。
 *    - 更新范围内现有的 MonthlyPlans 标题。
 *    - 删除范围外的 MonthlyPlans (实现范围缩减)。
 */
const updateGoalData = async (goalToUpdate, newTitle, newCategory) => {
  try {
    const planId = goalToUpdate.plan_id
    const year = new Date().getFullYear()
    
    // 更新父计划 (分类和标题)
    if (planId && (newTitle !== undefined || newCategory !== undefined)) {
      const updates = {}
      if (newTitle !== undefined) updates.title = newTitle
      if (newCategory !== undefined) updates.category = newCategory
      
      await db.plans.update(planId, updates)
    }

    const currentTitle = newTitle !== undefined ? newTitle : goalToUpdate.title
    
    // 获取该计划的所有现有月度计划
    const existingMonthlyPlans = monthlyPlans.value.filter(mp => mp.plan_id === planId)
    const existingMonths = existingMonthlyPlans.map(mp => {
      const d = new Date(mp.month)
      return d.getMonth() + 1
    })
    
    // 确定新范围
    const startM = goalToUpdate.startMonth || 1
    const endM = goalToUpdate.endMonth || startM
    const targetMonths = []
    for (let m = startM; m <= endM; m++) targetMonths.push(m)
    
    // 1. 创建缺失的月份
    const createPromises = []
    for (const m of targetMonths) {
      if (!existingMonths.includes(m)) {
        createPromises.push(db.monthlyPlans.create({
          plan_id: planId,
          user_id: authStore.userId,
          title: currentTitle,
          description: goalToUpdate.description || '', 
          month: `${year}-${String(m).padStart(2, '0')}-01`,
          status: 'active',
          priority: 2,
        }))
      }
    }
    
    // 2. 更新现有月份 (同步标题)
    const updatePromises = []
    if (newTitle !== undefined) {
      updatePromises.push(...existingMonthlyPlans.map(mp => 
        db.monthlyPlans.update(mp.id, { title: newTitle })
      ))
    }
    
    // 3. 删除不再范围内的月份
    // 过滤不在目标月份中的现有计划
    const toDelete = existingMonthlyPlans.filter(mp => {
      const m = new Date(mp.month).getMonth() + 1
      return !targetMonths.includes(m)
    })
    
    const deletePromises = toDelete.map(mp => db.monthlyPlans.delete(mp.id))
    
    await Promise.all([...createPromises, ...updatePromises, ...deletePromises])
    
    await fetchData()
    return true
  } catch (e) {
    console.error('Update goal failed:', e)
    return false
  }
}

/**
 * 更新目标（包括标题、分类和月份范围）
 * @param {Object} updatedGoal - 更新后的目标数据
 */
const handleUpdateGoal = async (updatedGoal) => {
  if (!editingGoal.value) return
  
  const success = await updateGoalData(
    editingGoal.value, 
    updatedGoal.title, 
    updatedGoal.category
  )
  
  if (success) {
    showAddModal.value = false
  }
}

/**
 * 添加新目标
 * @param {Object} newGoal - 新目标数据
 * 逻辑：
 * 1. 创建总目标 (Plan)。
 * 2. 循环创建指定范围内的所有 MonthlyPlans。
 */
const handleAddGoal = async (newGoal) => {
  try {
    console.log('Adding goal, authStore.userId:', authStore.userId)
    
    if (!authStore.userId) {
      console.error('User ID not available')
      return
    }
    
    const year = new Date().getFullYear()
    // 使用起始/结束月份作为范围
    const startM = newGoal.startMonth || 1
    const endM = newGoal.endMonth || startM
    
    // 第一步：创建父计划 (总目标)
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
    
    // 第二步：创建范围内的月度计划
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

/**
 * 删除目标
 * 逻辑：级联删除 DailyPlans -> MonthlyPlans -> Plans。
 */
const handleDeleteGoal = async () => {
  if (!editingGoal.value) return
  
  try {
    const planId = editingGoal.value.plan_id
    if (!planId) return

    // 1. 获取所有相关的月度计划
    const relatedMonthlyPlans = monthlyPlans.value.filter(mp => mp.plan_id === planId)
    
    // 2. 删除日计划 (级联：日 -> 月 -> 计划)
    for (const mp of relatedMonthlyPlans) {
      // 获取本月的日计划
      const dailyPlans = await db.dailyPlans.list(mp.id)
      // 删除本月所有日计划
      const dailyDeletePromises = dailyPlans.map(dp => db.dailyPlans.delete(dp.id))
      await Promise.all(dailyDeletePromises)
    }

    // 3. 删除月度计划
    const monthDeletePromises = relatedMonthlyPlans.map(mp => db.monthlyPlans.delete(mp.id))
    await Promise.all(monthDeletePromises)

    // 4. 删除父计划
    await db.plans.delete(planId)
    
    // 5. 清理状态
    if (selectedGoal.value && selectedGoal.value.plan_id === planId) {
      selectedGoal.value = null
      selectedMonth.value = null
    }

    await fetchData()
    showAddModal.value = false
  } catch (e) {
    console.error('Delete goal failed:', e)
  }
}

const goalKey = (m) => {
  if (!selectedGoal.value) return `undefined-${m}`
  return `plan-${selectedGoal.value.plan_id}-${m}`
}
const dayTaskKey = (day) => `${goalKey(selectedMonth.value)}-${day}`

const handleConfirmRange = async ({ start, end }) => {
  if (!selectedGoal.value) return
  
  // 乐观更新（可选，但 fetchData 会覆盖）
  // selectedGoal.value.startMonth = start
  // selectedGoal.value.endMonth = end
  
  // 构造一个带有新范围的临时目标对象
  const goalToUpdate = {
    ...selectedGoal.value,
    startMonth: start,
    endMonth: end
  }
  
  // 调用通用更新函数，不修改标题和分类
  await updateGoalData(goalToUpdate)
}

const isWithinRange = (m) => selectedGoal.value ? (m >= selectedGoal.value.startMonth && m <= selectedGoal.value.endMonth) : false
const activeMonthRange = computed(() => {
  if (!selectedGoal.value) return []
  let r = []; for (let i = selectedGoal.value.startMonth; i <= selectedGoal.value.endMonth; i++) r.push(i); return r
})

const isSelected = (m, day) => selectedDates[m]?.includes(day)
const hasTask = (m, day) => !!(dailyTasks[`${goalKey(m)}-${day}`]?.title)

/**
 * 校验选择一致性
 * 规则：
 * 1. 如果当前没有选中任何日期，允许选择。
 * 2. 如果已有选中日期，新选中的日期必须与第一个选中日期的状态（是否有任务）一致。
 */
const canSelect = (m, day) => {
  const current = selectedDates[m]
  if (!current || current.length === 0) return true
  
  const firstDay = current[0]
  const targetType = hasTask(m, firstDay)
  const currentType = hasTask(m, day)
  
  return targetType === currentType
}

const startSelection = (day) => {
  const m = selectedMonth.value
  
  // 校验一致性 (仅在添加时校验，取消选择不校验)
  const isCurrentlySelected = selectedDates[m]?.includes(day)
  if (!isCurrentlySelected && !canSelect(m, day)) return

  isSelecting.value = true
  if (!selectedDates[m]) selectedDates[m] = []
  
  const idx = selectedDates[m].indexOf(day)
  idx > -1 ? selectedDates[m].splice(idx, 1) : selectedDates[m].push(day)
}

const handleMouseEnter = (day) => {
  if (isSelecting.value) {
    const m = selectedMonth.value
    // 校验一致性
    if (!canSelect(m, day)) return
    
    if (!selectedDates[m].includes(day)) selectedDates[m].push(day)
  }
}

const endSelection = () => isSelecting.value = false

const applyBatchTask = async () => {
  const m = selectedMonth.value
  if (!m || !batchInput.value.trim()) return
  
  const content = batchInput.value
  const currentMp = monthlyPlans.value.find(mp => mp.plan_id === selectedGoal.value.plan_id && new Date(mp.month).getMonth() + 1 === m)
  
  if (!currentMp) {
    console.error('Monthly plan not found for batch apply')
    return
  }

  for (const day of selectedDates[m]) {
    const key = dayTaskKey(day)
    try {
      if (dailyTasks[key] && dailyTasks[key].id) {
        // 更新现有任务
        await db.dailyPlans.update(dailyTasks[key].id, { title: content })
        dailyTasks[key].title = content
      } else {
        // 创建新任务
        // 构造 YYYY-MM-DD 日期格式
        const year = new Date(currentMp.month).getFullYear()
        const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        
        const newDp = await db.dailyPlans.create({
          monthly_plan_id: currentMp.id,
          user_id: authStore.userId,
          date: dateStr,
          title: content,
        })
        dailyTasks[key] = newDp
      }
    } catch (e) {
      console.error(`Failed to save task for day ${day}`, e)
    }
  }
  batchInput.value = ''
  selectedDates[m] = [] // 操作完成后清除选中
}

const handleBatchDelete = async () => {
  const m = selectedMonth.value
  if (!m || !selectedDates[m] || selectedDates[m].length === 0) return
  
  // 确认删除（可选，但通常批量删除需要谨慎）
  // 这里直接执行删除逻辑
  
  for (const day of selectedDates[m]) {
    const key = dayTaskKey(day)
    try {
      if (dailyTasks[key] && dailyTasks[key].id) {
        await db.dailyPlans.delete(dailyTasks[key].id)
        delete dailyTasks[key] // 更新本地状态
      }
    } catch (e) {
      console.error(`Failed to delete task for day ${day}`, e)
    }
  }
  // 清空选中和输入
  selectedDates[m] = []
  batchInput.value = ''
}

const handleUpdateTask = async (task) => {
  if (!task || !task.id) return
  try {
    await db.dailyPlans.update(task.id, { title: task.title })
  } catch (e) {
    console.error('Failed to update task', e)
  }
}

const deselectAllInMonth = () => selectedDates[selectedMonth.value] = []
const toggleMonth = (m) => { selectedMonth.value = selectedMonth.value === m ? null : m; if (selectedMonth.value && !selectedDates[m]) selectedDates[m] = [] }
const datesWithTasks = computed(() => {
  if (!selectedMonth.value) return []
  const days = []
  // 检查所有可能的日期 (1-31)
  // 优化：我们可以遍历 dailyTasks 的键，但结构已扁平化。
  // 遍历 1-31 足够快。
  for (let d = 1; d <= 31; d++) {
    const key = dayTaskKey(d)
    if (dailyTasks[key] && dailyTasks[key].title) {
      days.push(d)
    }
  }
  return days.sort((a, b) => a - b)
})
const selectGoal = (g) => { selectedGoal.value = g; selectedMonth.value = null }
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>