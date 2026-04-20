<script setup>
/**
 * 今日打卡卡片组件 (HabitTodayCard.vue)
 *
 * @description
 * 习惯追踪模块的核心组件之一，用于在习惯页面顶部展示今日打卡入口。
 * 包含以下功能：
 * - 显示当前日期（由父组件传入）
 * - 提供快速打卡输入框，支持 Enter 键提交
 * - 圆形提交按钮，点击后触发快速打卡逻辑
 *
 * @example
 * <HabitTodayCard currentDate="2026-04-20" @quick-log="handleQuickLog" />
 *
 * @see {@link https://github.com/rhythm/rhythm} 习惯模块文档
 */
import { ref } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

defineProps({
  /**
   * 当前日期字符串，用于在卡片左侧展示
   * 格式建议：YYYY-MM-DD 或本地化日期格式
   */
  currentDate: {
    type: String,
    required: true
  }
})

// 定义组件触发的自定义事件
const emit = defineEmits(['quick-log'])

// 双向绑定到输入框，反映用户当前输入的习惯心得
const habitNote = ref('')

/**
 * 处理快速打卡提交
 *
 * @description
 * 当用户点击提交按钮或按 Enter 键时调用此方法。
 * 执行流程：
 * 1. 检查输入是否为空，若为空则直接返回（阻止空提交）
 * 2. 通过 emit 向上传递 'quick-log' 事件及输入内容
 * 3. 提交成功后清空输入框
 *
 * @returns {Promise<void>} 异步处理，但此处无 await 实际异步操作
 */
const handleQuickLog = async () => {
  if (!habitNote.value.trim()) return
  emit('quick-log', habitNote.value)
  habitNote.value = ''
}
</script>

<template>
  <Card class="border shadow-sm rounded-xl overflow-hidden bg-background">
    <CardContent class="p-4 flex items-center gap-6">
      <div class="shrink-0 flex flex-col border-r pr-6 gap-1">
        <span class="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">今日记录</span>
        <span class="text-sm font-bold tracking-tight">{{ currentDate }}</span>
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
</template>
