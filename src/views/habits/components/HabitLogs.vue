<script setup>
/**
 * 习惯打卡流水日志组件 (HabitLogs.vue)
 * 列出特定习惯最近打卡的列表，用于展示随手记录下的每一条打卡心得语录。
 */
import { computed } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'

const props = defineProps({
  /**
   * 包含所有打卡记录数据节点的原始数据库返回数组
   */
  logs: {
    type: Array,
    default: () => []
  }
})

/**
 * 格式化后的日志数据源
 * 对原有的乱序或不统一的记录按 `completed_at` 打卡时间做格式转换并降序排列 (最近的数据优先展出)。
 */
const formattedLogs = computed(() => {
  return (props.logs || [])
    .map(log => {
      const date = new Date(log.completed_at)
      const month = date.getMonth() + 1
      const day = date.getDate()
      return {
        id: log.id,
        month,
        day,
        completedAt: log.completed_at,
        date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
        logText: log.log || ''
      }
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
})
</script>

<template>
  <div class="pb-20 pt-6">
    <div class="flex flex-col gap-2 mb-8 items-center text-center">
      <h3 class="text-lg font-bold tracking-tight">往日日志</h3>
      <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">“坚持胜过爆发”</p>
    </div>

    <div v-if="formattedLogs.length === 0" class="text-center py-8 text-muted-foreground">
      <p class="text-sm">暂无日志记录，开始你的习惯旅程吧</p>
    </div>

    <div v-else class="flex flex-col gap-4">
      <Card v-for="log in formattedLogs" :key="log.id"
           class="group cursor-pointer transition-all border shadow-sm rounded-xl hover:translate-x-1 duration-300">
        <CardContent class="p-4 flex items-center gap-6">
          <div class="shrink-0 flex flex-col border-r pr-6 gap-1">
            <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest leading-none">{{ log.date }}</span>
            <span class="text-sm font-bold tracking-tight">打卡</span>
          </div>
          <p class="flex-1 text-sm font-medium tracking-tight text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-relaxed">
            {{ log.logText || '成功完成了今天的习惯打卡，继续坚持吧。' }}
          </p>
          <div class="w-8 h-8 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
            <ArrowUpRight class="w-4 h-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
