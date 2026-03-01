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
/**
 * 习惯页面级主视图组件 (habits/index.vue)
 * 编排并整合习惯列表侧边栏、中心动态看板、各项统计以及编辑/新建弹窗模块。
 * 数据源由底部抽离出的多个 hooks 提供支持。
 */
import { ref, onMounted } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

import HabitSidebar from './components/HabitSidebar.vue'
import HabitStats from './components/HabitStats.vue'
import HabitCalendar from './components/HabitCalendar.vue'
import HabitLogs from './components/HabitLogs.vue'
import AddHabitModal from './components/AddHabitModal.vue'
import EditHabitModal from './components/EditHabitModal.vue'
import { useHabitData } from './composables/useHabitData'
import { useHabitStats } from './composables/useHabitStats'
import { useHabitLogs } from './composables/useHabitLogs'

// 1. 获取核心数据层面能力支撑
const {
  habits,
  selectedHabit,
  viewYear,
  viewMonth,
  handleMonthChange,
  fetchHabits
} = useHabitData()

// 2. 统计计算层面能力支撑
const {
  todayCompletionRate,
  habitStats
} = useHabitStats(habits, selectedHabit)

// 3. 执行打卡和简易文字日志的支撑
const {
  toggleComplete,
  handleQuickLog: performQuickLog
} = useHabitLogs(selectedHabit, viewYear, viewMonth, fetchHabits)

// 控制首屏立刻请求初始化拉取数据列表
onMounted(fetchHabits)

// --- 页面 UI 自身专有的局部状态和操控方法 ---

const showAddModal = ref(false) // 开启和关闭新建习惯弹窗状态位
const showEditModal = ref(false) // 开启和关闭编辑习惯弹窗状态位
const habitNote = ref('') // 给“今日记录”卡片绑定的临时短文本输入内容

/**
 * 响应来自左侧边栏触发的编辑命令 (例如鼠标双击)
 * 装载对应数据后拉起更改弹窗。
 */
const handleSidebarEdit = (habit) => {
  selectedHabit.value = habit
  showEditModal.value = true
}

/**
 * 简易日期格式化工具方法
 * 返回纯展示用的类似于 `3月1日` 中文日期字符串
 */
const getCurrentDate = () => {
  const now = new Date()
  return `${now.getMonth() + 1}月${now.getDate()}日`
}

/**
 * 将绑定的文本传递给底层的日志创建 hook，执行打卡后清空文字框本身。
 */
const handleQuickLog = async () => {
  const success = await performQuickLog(habitNote.value)
  if (success) {
    habitNote.value = ''
  }
}
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
</style>