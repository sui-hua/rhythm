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
 * @file AddHabitModal.vue
 * @description 添加习惯弹窗组件，提供一个全屏居中的模态对话框，
 * 用于引导用户输入新习惯的名称、时间和时长，并完成创建。
 *
 * @prop {boolean} show - 控制弹窗的显示与隐藏，遵循 v-model:show 双向绑定约定
 *
 * @emits {Function} close - 关闭弹窗事件（目前未独立使用，关闭通过 update:show 实现）
 * @emits {Function} refresh - 创建成功后触发，通知父组件刷新习惯列表数据
 * @emits {Function} update:show - 支持 v-model:show 语法，用于双向绑定弹窗可见性
 *
 * @see {@link https://github.com/radix-ui/primitives|Radix Vue Dialog} 底层 Dialog 组件
 */
import { reactive } from 'vue'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { withLoadingLock } from '@/utils/throttle'

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
// 用于收集用户输入的习惯名称、时间、时长等信息
const form = reactive({
  title: '', // 习惯名称，用于显示在习惯列表和日历热力图中
  task_time: '', // 习惯指定的执行时间，格式为 HH:mm，用于在日历上显示时间
  duration: 10 / 60 // 习惯预估的持续时长，UI 表现层使用小时为单位（如 10 分钟存为 10/60）
})

/**
 * 提交表单创建新习惯记录
 *
 * 执行流程：
 * 1. 验证表单数据（习惯名称必填）
 * 2. 获取当前登录用户的 userId
 * 3. 调用 db.habits.create 创建数据库记录
 * 4. 重置表单数据
 * 5. 关闭弹窗并通知父组件刷新列表
 *
 * 注意：数据库中 duration 以分钟为单位存储，因此需要将小时基数 * 60 转换
 *       默认时长为 10 分钟（即 10/60 小时）
 */
const submit = withLoadingLock(async () => {
  if (!form.title.trim()) return

  const userId = authStore.userId
  if (!userId) {
      console.error('User not authenticated')
      return
  }

  try {
    // 创建习惯记录，frequency 固定为 daily（每日习惯）
    await db.habits.create({
      user_id: userId,
      title: form.title,
      task_time: form.task_time || null, // 时间为空时存储 null
      duration: Math.round((Number(form.duration) || 0) * 60) || 10, // 转换小时为分钟，默认 10 分钟
      frequency: { type: 'daily' }, // 固定每日习惯
      target_value: 1, // 目标完成值默认为 1
      archived: false // 新习惯默认未归档
    })

    emit('refresh') // 通知父组件刷新习惯列表
    // 重置表单为初始状态
    form.title = ''
    form.task_time = ''
    form.duration = 10 / 60
    emit('update:show', false) // 关闭弹窗
  } catch (e) {
    console.error('Add habit failed in modal', e)
  }
})
</script>