<script setup>
/**
 * 今日打卡卡片组件 (HabitTodayCard.vue)
 * 包含日期显示、快速打卡输入框和提交按钮。
 * 用户可在此输入习惯心得并快速打卡。
 */
import { ref } from 'vue'
import { ArrowUpRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

defineProps({
  /**
   * 当前日期字符串，用于展示今日日期
   */
  currentDate: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['quick-log'])

const habitNote = ref('')

/**
 * 处理快速打卡：验证输入后提交日志并清空输入框
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
