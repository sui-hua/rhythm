<template>
  <div class="flex-1 bg-white flex flex-col overflow-hidden">
    <!-- 顶部统计栏 -->
    <header class="p-6 md:p-10 border-b">
      <div class="flex justify-between items-end">
        <div class="flex flex-col gap-1">
          <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 block">任务归档</span>
          <h3 class="text-3xl font-bold tracking-tight text-foreground leading-none">
            {{ selectedMonth ? months[selectedMonth-1].full : '无内容' }}
          </h3>
        </div>
        <div class="text-right flex flex-col items-end gap-1">
          <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">周期密度</p>
          <div class="text-lg font-bold tracking-tight">
            {{ sortedSelectedDates.length }}
            <span class="text-xs text-muted-foreground font-medium ml-0.5">/ 31</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 任务列表滚动区域 -->
    <ScrollArea class="flex-1 px-6 md:px-10 py-6 pb-6">
      <div v-if="sortedSelectedDates.length > 0" class="flex flex-col relative">
        <!-- 时间轴线 -->
        <div class="absolute left-5 top-4 bottom-4 w-px bg-zinc-100"></div>

        <TransitionGroup name="task-list">
          <div v-for="day in sortedSelectedDates" :key="day" class="pl-10 pb-6 group last:pb-0">
            <!-- 内容容器 (相对定位用于放置 Dot) -->
            <div class="flex items-center gap-3 relative">
              <!-- 时间节点 (绝对定位 + 垂直居中) -->
              <!-- Line at left-5 (20px). Container padding 40px. Dot center target -20px. Dot Left = -20 - 5 = -25px -->
              <div class="absolute left-[-25px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-zinc-200 ring-4 ring-white group-hover:bg-primary transition-colors z-10"></div>
              
              <!-- 日期 -->
              <span class="text-xs font-bold font-mono text-muted-foreground/50 uppercase tracking-widest group-hover:text-primary transition-colors w-10 text-right shrink-0">
                 {{ String(day).padStart(2, '0') }}
              </span>

              <!-- 任务内容卡片 -->
              <div v-if="dailyTasks[dayTaskKey(day)]" 
                   class="min-h-[50px] flex-1 rounded-xl border border-zinc-100 bg-white p-3 text-sm font-medium tracking-tight leading-relaxed text-foreground shadow-sm hover:shadow-md transition-all group-hover:border-zinc-200 flex flex-col gap-2">
                <input
                  class="font-medium bg-transparent border-none outline-none w-full"
                  :value="dailyTasks[dayTaskKey(day)].title"
                  @blur="(e) => $emit('update-task', { ...dailyTasks[dayTaskKey(day)], title: e.target.value })"
                  @keyup.enter="(e) => e.target.blur()"
                />
                <div class="flex items-center gap-4 border-t border-zinc-50 pt-2">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">时间</span>
                    <input 
                      type="time" 
                      class="text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[60px]"
                      :value="dailyTasks[dayTaskKey(day)].task_time ? dailyTasks[dayTaskKey(day)].task_time.slice(0, 5) : ''"
                      @blur="(e) => $emit('update-task', { ...dailyTasks[dayTaskKey(day)], task_time: e.target.value || null })"
                      @keyup.enter="(e) => e.target.blur()"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">时长</span>
                    <div class="flex items-center">
                      <input 
                        type="number" 
                        class="text-xs bg-transparent border-none outline-none text-muted-foreground font-mono w-[40px] text-right"
                        :value="dailyTasks[dayTaskKey(day)].duration"
                        @blur="(e) => $emit('update-task', { ...dailyTasks[dayTaskKey(day)], duration: e.target.value ? parseInt(e.target.value) : null })"
                        @keyup.enter="(e) => e.target.blur()"
                      />
                      <span class="text-xs text-muted-foreground font-mono ml-1">m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <!-- 空状态 -->
      <div v-else class="h-64 flex flex-col items-center justify-center text-center p-6 border border-zinc-100 rounded-xl bg-zinc-50/30">
        <p class="text-sm text-muted-foreground">暂无归档内容，请先在下方日期面板中规划任务。</p>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup>
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'

const emit = defineEmits(['update-task'])

const props = defineProps({
  // 当前选中的月份
  selectedMonth: {
    type: Number,
    default: null
  },
  // 月份数据列表
  months: {
    type: Array,
    required: true
  },
  // 已选中并排序的日期列表 [1, 5, 12...]
  sortedSelectedDates: {
    type: Array,
    required: true
  },
  // 日任务字典 {key: taskContent}
  dailyTasks: {
    type: Object,
    required: true
  },
  // 生成日任务Key的辅助函数 (day => string)
  dayTaskKey: {
    type: Function,
    required: true
  }
})

/**
 * 文本域高度自适应
 * @param {Event} e - 输入事件
 * 功能：根据内容自动调整 textarea 高度，防止滚动条出现。
 */
const autoGrow = (e) => {
  e.target.style.height = 'auto'
  e.target.style.height = e.target.scrollHeight + 'px'
}
</script>

<style scoped>
.task-list-enter-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.task-list-enter-from { opacity: 0; transform: translateX(30px); }
</style>
