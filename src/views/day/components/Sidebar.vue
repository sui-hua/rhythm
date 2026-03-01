<template>
  <aside 
    class="border-r border-zinc-100 flex flex-col z-20 bg-background relative overflow-hidden group/sidebar"
    :style="{ width: width + 'px' }"
  >
    <!-- 侧边栏宽度拖拽调整手柄 -->
    <div 
      class="absolute right-0 top-0 bottom-0 w-1 hover:bg-primary/10 cursor-col-resize z-50 transition-colors opacity-0 group-hover/sidebar:opacity-100"
      :class="{ 'bg-primary/20 opacity-100': isResizing }"
      @mousedown="startResize">
    </div>

    <header class="px-6 pt-10 pb-6 shrink-0 border-b border-border mb-4">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl font-semibold tracking-tight">{{ selectedDay }}日</h2>
        <p class="text-xs text-muted-foreground">{{ selectedMonthName }} 任务清单</p>
      </div>
    </header>

    <!-- 侧边栏任务列表，可滚动 -->
    <ScrollArea class="flex-1 px-4 relative z-10 no-scrollbar">
      <div class="flex flex-col gap-2 pb-24 pt-2">
        <div v-for="(item, index) in dailySchedule" :key="index" 
             @click="$emit('scrollToTask', index)"
             @dblclick="$emit('edit-task', index)"
             class="flex items-center gap-3 p-3 rounded-lg transition-all group cursor-pointer"
             :class="[item.completed ? 'opacity-50' : 'hover:bg-zinc-50']">
          
          <div @click.stop @dblclick.stop>
            <Checkbox 
              :checked="item.completed" 
              @update:checked="handleToggleComplete(item)"
              class="shrink-0 w-5 h-5 rounded-md"
            />
          </div>

          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span class="text-[10px] font-mono font-medium text-muted-foreground">{{ item.time }}</span>
            <div class="flex items-center justify-between gap-2">
              <h4 class="text-sm font-semibold tracking-tight truncate transition-all" :class="{ 'line-through text-muted-foreground': item.completed }">
                {{ item.title }}
              </h4>
              <Pencil class="w-3 h-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>

    <!-- 侧边栏底部统计和添加按钮 -->
    <footer class="p-6 border-t border-border bg-zinc-50/50 backdrop-blur-sm relative z-10 flex flex-col gap-4">
      <div class="w-full">
        <div class="flex justify-between items-center mb-2">
          <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">任务完成度</span>
          <span class="text-[10px] font-bold text-primary">{{ Math.round((dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)) }}%</span>
        </div>
        <Progress :model-value="(dailySchedule.length ? (completedCount/dailySchedule.length * 100) : 0)" class="h-1 shadow-none" />
      </div>
      <Button 
        class="w-full gap-2 h-9 text-xs font-semibold"
        @click="$emit('addEvent')"
      >
        <Plus class="w-4 h-4" />
        添加项目
      </Button>
    </footer>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { db } from '@/services/database'
import { Plus, Pencil } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

import { useResizable } from '@/composables/useResizable'

const props = defineProps({
  dailySchedule: Array, // 整合后的每日日程列表
  completedCount: Number // 已完成的任务数量
})

import { useDateStore } from '@/stores/dateStore'
import { getMonthName } from '@/utils/dateFormatter'

const dateStore = useDateStore()

const selectedDay = computed(() => dateStore.currentDate.getDate())
const selectedMonthName = computed(() => getMonthName(dateStore.currentDate.getMonth() + 1, 'full'))

// 侧边栏宽度拖拽逻辑
const { width, startResize, isResizing } = useResizable()

// 定义向外暴露的自定义事件
const emit = defineEmits(['goBack', 'scrollToTask', 'refresh', 'addEvent', 'edit-task'])

// 替代原本在父组件的交互逻辑：支持各类日程项的完成切换
const handleToggleComplete = async (task) => {
  if (task) {
      try {
          if (task.type === 'task') {
              // 处理普通任务：直接切换 completed 状态（ true / false ）
              await db.tasks.update(task.id, { completed: !task.completed })
          } else if (task.type === 'habit') {
              // 处理日常习惯打卡：习惯的完成是通过在 habit_logs 表中增加记录来实现的
              if (task.completed) {
                  // 如果当前是已完成状态，说明要取消打卡，需要查找打卡记录并删除
                  const logs = await db.habits.list().then(res => res.find(h => h.id === task.id)?.habit_logs || [])
                  
                  const year = dateStore.currentDate.getFullYear()
                  const month = dateStore.currentDate.getMonth()
                  const day = dateStore.currentDate.getDate()
                  const startOfDay = new Date(year, month, day, 0, 0, 0)
                  const endOfDay = new Date(year, month, day, 23, 59, 59)
                  
                  const log = logs.find(l => {
                    const logDate = new Date(l.completed_at)
                    return logDate >= startOfDay && logDate <= endOfDay
                  })
                  
                  if (log) {
                      await db.habits.deleteLog(log.id)
                  }
              } else {
                  // 如果当前是未完成状态，说明要进行打卡，新增一条打卡记录（会自动采用当前系统时间）
                  await db.habits.log(task.id, '')
              }
          } else if (task.type === 'daily_plan') {
              // 处理今日计划：支持数字类型 (0/1) 或字符串类型 ('pending'/'completed') 的状态
              const isNumeric = typeof task.original.status === 'number'
              const newStatus = isNumeric ? (task.completed ? 0 : 1) : (task.completed ? 'pending' : 'completed')
              await db.dailyPlans.update(task.id, { status: newStatus })
          }
          // 状态更新后，触发父组件刷新数据
          emit('refresh')
      } catch (e) {
          console.error('切换完成状态失败', e)
      }
  }
}
</script>