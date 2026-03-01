<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2 text-center">
          <DialogTitle class="text-2xl font-semibold tracking-tight">添加新习惯</DialogTitle>
          <DialogDescription class="text-sm text-muted-foreground">开始你的新习惯，坚持成就不凡。</DialogDescription>
        </div>

        <div class="grid gap-6">
          <div class="grid gap-2">
            <label for="habit-title" class="text-sm font-medium leading-none">习惯名称</label>
            <Input 
              id="habit-title"
              v-model="form.title"
              placeholder="例如：每日阅读 / 早起健身"
              class="h-9"
              @keyup.enter="submit"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <TimePicker 
              v-model="form.task_time" 
              label="习惯时间"
              id="habit-time"
            />

            <DurationPicker 
              v-model="form.duration" 
              label="习惯时长"
              id="habit-duration"
              @submit="submit"
            />
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <Button 
              class="w-full h-9 bg-primary text-primary-foreground font-semibold"
              @click="submit"
              :disabled="!form.title.trim()"
            >
              确认创建
            </Button>
            <Button 
              variant="outline"
              class="w-full h-9"
              @click="$emit('update:show', false)"
            >
              取消
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
/**
 * 添加习惯弹窗组件 (AddHabitModal.vue)
 * 提供一个弹窗用于收集用户输入并创建新的习惯。
 */
import { reactive } from 'vue'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'

const props = defineProps({
  /** 控制弹窗的显示与隐藏状态 */
  show: Boolean
})

const authStore = useAuthStore()

const emit = defineEmits([
  'close', // 关闭弹窗事件 (暂未使用该单独事件)
  'refresh', // 创建成功后触发的数据刷新请求
  'update:show' // 支持 v-model:show 的双向数据绑定更新事件
])

// 弹窗内的表单响应式数据
const form = reactive({
  title: '', // 习惯名称
  task_time: '', // 习惯指定的执行时间 (HH:mm)
  duration: 10 / 60 // 习惯预估的持续时长, UI 表现层使用小时基数 (比如 10 分钟为 10/60)
})

/**
 * 提交表单创建新记录
 */
const submit = async () => {
  if (!form.title.trim()) return
  
  const userId = authStore.userId
  if (!userId) {
      console.error('User not authenticated')
      return
  }

  try {
    await db.habits.create({
      user_id: userId,
      title: form.title,
      task_time: form.task_time || null,
      duration: Math.round((Number(form.duration) || 0) * 60) || 10,
      frequency: { type: 'daily' },
      target_value: 1,
      archived: false
    })
    
    emit('refresh')
    form.title = ''
    form.task_time = ''
    form.duration = 10 / 60
    emit('update:show', false)
  } catch (e) {
    console.error('Add habit failed in modal', e)
  }
}
</script>