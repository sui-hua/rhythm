<template>
  <div class="pb-32 px-6 md:px-10" @mouseup="$emit('end-selection')">
    <TransitionGroup name="list">
      <Card v-for="m in activeMonthRange" :key="m"
           class="mb-4 rounded-xl transition-all duration-300 overflow-hidden border shadow-sm"
           :class="selectedMonth === m ? 'ring-1 ring-primary' : 'hover:bg-accent/30'">
        
        <!-- 月份标题栏 -->
        <div @click="$emit('toggle-month', m)" 
             class="px-6 py-4 cursor-pointer flex items-center justify-between bg-zinc-50/30 transition-colors hover:bg-zinc-100/50">
          <div class="flex items-center gap-6 flex-1 min-w-0">
            <span class="text-sm font-mono font-bold text-muted-foreground shrink-0">0{{ m }}月</span>
            
            <div class="flex-1 min-w-0 max-w-xl">
              <!-- 编辑模式：输入月度目标 -->
              <div v-if="selectedMonth === m" @click.stop class="mb-1">
                <Input 
                  :model-value="monthlyMainGoals[goalKey(m)]"
                  @update:model-value="monthlyMainGoals[goalKey(m)] = $event"
                  class="bg-background text-lg font-semibold tracking-tight h-10 shadow-sm w-full"
                  placeholder="点此分配本月主要任务..." 
                />
              </div>
              <!-- 展示模式：显示月度目标 -->
              <h3 v-else class="text-xl font-bold tracking-tight truncate transition-all" 
                  :class="monthlyMainGoals[goalKey(m)] ? 'text-foreground' : 'text-muted-foreground/30'">
                {{ monthlyMainGoals[goalKey(m)] || '暂无计划' }}
              </h3>
            </div>
          </div>
          
          <!-- 折叠/展开 按钮 -->
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

        <!-- 展开内容区域 -->
        <div v-if="selectedMonth === m" class="p-6 space-y-8 animate-in slide-in-from-top-2 border-t bg-background/50">
          <!-- 日历网格区域 -->
          <!-- 
             [交互说明] 批量拖拽选中算法
             这是一个典型的“状态机”逻辑：
             1. mousedown -> 开启记录 (isSelecting = true)
             2. mouseenter -> 持续记录经过的格子 (Add to Set/Array)
             3. mouseup -> 停止记录 (isSelecting = false) – 这个事件通常挂在 window 或最外层容器上，防止鼠标移出格子松开没被捕获。
          -->

          <!-- 星期表头 -->
          <div class="grid grid-cols-7 gap-2 mb-2 text-center">
            <div v-for="(wk, index) in ['周日', '周一', '周二', '周三', '周四', '周五', '周六']" :key="wk" 
                 @click="selectWeekDay(m, index)"
                 class="text-[10px] font-bold text-muted-foreground opacity-50 cursor-pointer hover:text-primary hover:opacity-100 transition-all select-none py-1 rounded-sm hover:bg-muted/50">
              {{ wk }}
            </div>
          </div>

          <!-- 日历网格视图 -->
          <div class="grid grid-cols-7 gap-2 place-items-center" @mousedown.stop @mouseleave="$emit('end-selection')">
            <!-- 空白占位符：用于对齐第一天 -->
            <div v-for="offset in getMonthOffset(m)" :key="'spacer-'+m+'-'+offset" class="aspect-square md:h-10"></div>
            
            <div v-for="day in 31" :key="'grid-'+day" 
                 @mousedown="$emit('start-selection', day)" 
                 @mouseenter="$emit('enter-selection', day)"
                 class="aspect-square md:h-10 rounded-md border flex items-center justify-center cursor-pointer transition-all select-none text-[10px] font-bold relative"
                 :class="[
                   isSelected(m, day) ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 
                   hasTask(m, day) ? 'bg-secondary border-transparent text-secondary-foreground' : 
                   'bg-background border-border text-muted-foreground hover:border-primary/50',
                   !canSelect(m, day) ? 'cursor-not-allowed opacity-30 hover:border-transparent' : ''
                 ]">
              {{ day }}
              <div v-if="hasTask(m, day)" class="absolute bottom-1 w-1 h-1 rounded-full" 
                   :class="isSelected(m, day) ? 'bg-primary-foreground' : 'bg-primary'"></div>
            </div>
          </div>

          <!-- 批量操作控制条 -->
          <Transition name="popover">
            <div v-if="selectedDates[m]?.length > 0" 
                 class="bg-white text-foreground rounded-xl p-3 flex items-center gap-3 shadow-xl border border-zinc-100 ring-1 ring-black/5">
              <div class="px-4 border-r border-zinc-100 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-muted-foreground">
                {{ selectedDates[m].length }} 天选中
              </div>
              <Input 
                :model-value="batchInput" 
                @update:model-value="$emit('update:batchInput', $event)" 
                @keyup.enter="$emit('apply-batch')" 
                class="flex-1 bg-zinc-50 border-transparent focus-visible:bg-white transition-all text-foreground h-9 shadow-sm" 
                placeholder="批量输入任务内容..." 
              />
              <div class="flex items-center gap-1">
                <template v-if="isAllSelectedDatesHaveTask(m)">
                   <Button @click="$emit('apply-batch')" :disabled="!batchInput.trim()" class="h-9 font-bold text-[10px] px-4 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 shadow-none border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed">
                     修改
                   </Button>
                   <Button @click="$emit('delete-batch')" class="h-9 font-bold text-[10px] px-4 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 shadow-none border border-red-200">
                     删除
                   </Button>
                </template>
                <template v-else>
                   <Button @click="$emit('apply-batch')" :disabled="!batchInput.trim()" class="h-9 font-bold text-[10px] px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">应用</Button>
                </template>
              </div>
            </div>
          </Transition>
        </div>
      </Card>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ChevronDown, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const props = defineProps({
  // 当前显示的目标所涵盖的月份列表 (例如 [1, 2, 3])
  activeMonthRange: {
    type: Array,
    required: true
  },
  // 当前展开的月份，null 表示全部折叠
  selectedMonth: {
    type: Number,
    default: null
  },
  // 月度目标字典 {key: title}
  monthlyMainGoals: {
    type: Object,
    required: true
  },
  // 生成目标Key的辅助函数 (m => string)
  goalKey: {
    type: Function,
    required: true
  },
  // 选中的日期集合 {month: [days]}
  selectedDates: {
    type: Object,
    required: true
  },
  // 判断某天是否有任务的函数
  hasTask: {
    type: Function,
    required: true
  },
  // 判断某天是否被选中的函数
  isSelected: {
    type: Function,
    required: true
  },
  // 批量输入的文本绑定的值
  batchInput: {
    type: String,
    default: ''
  },

  // 判断某天是否可选的函数
  canSelect: {
    type: Function,
    default: () => true
  }
})

defineEmits([
  'toggle-month', 
  'update:batchInput', 
  'apply-batch', 
  'deselect-all', 
  'start-selection', 
  'enter-selection', 
  'end-selection',
  'delete-batch'
])

/**
 * 处理滑动条值变更
 * @param {number} m - 月份
 * @param {number[]} vals - 滑动条返回的数值数组 [start, end]
 * 功能：当滑动条拖动时，自动选中 start 到 end 之间的所有整数日期。
 */
const handleSliderChange = (m, vals) => {
  // console.log('Slider change:', m, vals)
  // 确保处理单点和范围两种情况，Slider 组件返回的是数组
  const start = vals[0]
  const end = vals[vals.length - 1] // 取首尾，兼容单滑块或多滑块
  
  const newSelection = []
  for (let i = start; i <= end; i++) {
    newSelection.push(i)
  }
  
  // 更新 props.selectedDates (直接修改 Reactive 对象以触发更新)
  props.selectedDates[m] = newSelection
}

/**
 * 获取滑动条的当前显示值
 * @param {number} m - 月份
 * @returns {number[]} - [min, max] 用于显示滑动条范围
 */
const getSliderValue = (m) => {
  const dates = props.selectedDates[m] || []
  if (dates.length > 0) {
    const min = Math.min(...dates)
    const max = Math.max(...dates)
    // 始终返回两个值以维持范围选择器（双滑块）的视觉效果
    return [min, max]
  }
  // 默认值：如果没有选中，显示在开头 [1, 1]
  return [1, 1]
}

/**
 * 获取月份第一天的星期偏移量 (0-6, 0=周日)
 * @param {number} m - 月份
 * @returns {number}
 */
const getMonthOffset = (m) => {
  const year = new Date().getFullYear()
  const date = new Date(year, m - 1, 1)
  return date.getDay()
}

/**
 * 选中或取消选中某个月份中特定星期的所有日期
 * @param {number} m - 月份
 * @param {number} weekIndex - 星期几索引 (0=周日, 1=周一...)
 * 逻辑：如果该列已全选，则取消全选；否则全选该列。
 */
const selectWeekDay = (m, weekIndex) => {
  const year = new Date().getFullYear()
  const daysInMonth = new Date(year, m, 0).getDate()
  
  // 1. 找出该月所有符合星期几的日期
  const targetDays = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, m - 1, d).getDay()
    if (dayOfWeek === weekIndex) {
      targetDays.push(d)
    }
  }
  
  // 2. 检查当前选中状态
  const currentSelection = props.selectedDates[m] || []
  const isAllSelected = targetDays.every(d => currentSelection.includes(d))
  
  let newSelection
  if (isAllSelected) {
    // 反选：移除所有该星期的日期
    newSelection = currentSelection.filter(d => !targetDays.includes(d))
  } else {
    // 全选：添加该星期所有日期 (去重)
    newSelection = [...new Set([...currentSelection, ...targetDays])]
  }
  
  // 3. 更新并排序
  props.selectedDates[m] = newSelection.sort((a, b) => a - b)
}

/**
 * 判断当前选中的所有日期是否都已经有任务
 * 用于切换"应用" vs "修改/删除" 模式
 */
const isAllSelectedDatesHaveTask = (m) => {
  const dates = props.selectedDates[m] || []
  if (dates.length === 0) return false
  return dates.every(day => props.hasTask(m, day))
}
</script>

<style scoped>
.popover-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.popover-enter-from { opacity: 0; transform: translateY(20px) scale(0.9); }
</style>
