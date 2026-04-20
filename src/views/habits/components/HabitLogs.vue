<template>
  <div class="pb-20 pt-6">
    <div class="flex flex-col gap-2 mb-8 items-center text-center">
      <h3 class="text-lg font-bold tracking-tight">往日日志</h3>
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

<script setup>
/**
 * HabitLogs.vue - 习惯打卡日志组件
 * 
 * 功能说明：
 * - 展示指定习惯的所有历史打卡记录列表
 * - 每条记录显示打卡日期和用户填写的日志内容
 * - 提供无记录时的空状态提示
 * 
 * 使用方式：
 * <HabitLogs :logs="habitLogs" />
 * 
 * 依赖组件：
 * - Card, CardContent (ui/card) - 日志卡片容器
 * - ArrowUpRight (lucide-vue-next) - 右上角箭头图标
 * 
 * 依赖 Composable：
 * - useHabitLogsFormatter - 格式化日志数据，转换为展示所需格式
 * 
 * @prop {Array} logs - 原始打卡记录数组，每项包含 id、日期、日志文本等字段
 */
import { ArrowUpRight } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { useHabitLogsFormatter } from '@/views/habits/composables/useHabitLogs'

const props = defineProps({
  /**
   * 包含所有打卡记录数据节点的原始数据库返回数组
   */
  logs: {
    type: Array,
    default: () => []
  }
})

const { formattedLogs } = useHabitLogsFormatter(props.logs)
</script>