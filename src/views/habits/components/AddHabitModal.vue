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

          <div class="grid gap-3">
            <label class="text-sm font-medium leading-none">重复方式</label>

            <div class="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                :class="form.frequencyType === 'daily' ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' : ''"
                @click="form.frequencyType = 'daily'"
              >
                每日
              </Button>
              <Button
                type="button"
                variant="outline"
                :class="form.frequencyType === 'weekly' ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' : ''"
                @click="form.frequencyType = 'weekly'"
              >
                每周
              </Button>
              <Button
                type="button"
                variant="outline"
                :class="form.frequencyType === 'monthly' ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' : ''"
                @click="form.frequencyType = 'monthly'"
              >
                每月
              </Button>
            </div>

            <div v-if="form.frequencyType === 'weekly'" class="grid gap-2">
              <p class="text-xs text-muted-foreground">选择每周执行的星期</p>
              <div class="grid grid-cols-7 gap-2">
                <Button
                  v-for="item in WEEKDAY_OPTIONS"
                  :key="item.value"
                  type="button"
                  variant="outline"
                  :class="form.weekdays.includes(item.value) ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' : ''"
                  @click="toggleWeekday(item.value)"
                >
                  {{ item.label }}
                </Button>
              </div>
            </div>

            <div v-if="form.frequencyType === 'monthly'" class="grid gap-2">
              <p class="text-xs text-muted-foreground">选择每月执行的日期</p>
              <div class="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto pr-1">
                <Button
                  v-for="day in MONTH_DAY_OPTIONS"
                  :key="day"
                  type="button"
                  variant="outline"
                  :class="form.monthDays.includes(day) ? 'bg-primary text-primary-foreground border-primary hover:bg-primary hover:text-primary-foreground' : ''"
                  @click="toggleMonthDay(day)"
                >
                  {{ day }}
                </Button>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <Button 
              class="w-full h-9 bg-primary text-primary-foreground font-semibold"
              @click="submit"
              :disabled="!form.title.trim() || !canSubmitFrequency"
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
import { computed, reactive } from 'vue'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { withLoadingLock } from '@/utils/throttle'
import {
  createDefaultHabitFrequency,
  normalizeHabitFrequency
} from '@/views/habits/utils/habitFrequency'

const props = defineProps({
  /** 控制弹窗的显示与隐藏状态 */
  show: Boolean
})

const authStore = useAuthStore()

const WEEKDAY_OPTIONS = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 }
]

const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, index) => index + 1)

const emit = defineEmits([
  'close', // 关闭弹窗事件 (暂未使用该单独事件)
  'refresh', // 创建成功后触发的数据刷新请求
  'update:show' // 支持 v-model:show 的双向数据绑定更新事件
])

// 弹窗内的表单响应式数据
// 用于收集用户输入的习惯名称、时间、时长等信息
const form = reactive({
  title: '', // 习惯名称，用于显示在习惯列表和日历热力图中
  task_time: '08:00', // 习惯指定的执行时间，格式为 HH:mm，用于在日历上显示时间
  duration: 10 / 60, // 习惯预估的持续时长，UI 表现层使用小时为单位（如 10 分钟存为 10/60）
  frequencyType: 'daily',
  weekdays: [],
  monthDays: []
})

const canSubmitFrequency = computed(() => {
  if (form.frequencyType === 'weekly') return form.weekdays.length > 0
  if (form.frequencyType === 'monthly') return form.monthDays.length > 0
  return true
})

const toggleWeekday = (weekday) => {
  form.weekdays = form.weekdays.includes(weekday)
    ? form.weekdays.filter((item) => item !== weekday)
    : [...form.weekdays, weekday].sort((a, b) => a - b)
}

const toggleMonthDay = (day) => {
  form.monthDays = form.monthDays.includes(day)
    ? form.monthDays.filter((item) => item !== day)
    : [...form.monthDays, day].sort((a, b) => a - b)
}

const buildFrequencyPayload = () => {
  if (form.frequencyType === 'weekly') {
    return normalizeHabitFrequency({
      type: 'weekly',
      weekdays: form.weekdays
    })
  }

  if (form.frequencyType === 'monthly') {
    return normalizeHabitFrequency({
      type: 'monthly',
      monthDays: form.monthDays
    })
  }

  return createDefaultHabitFrequency()
}

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
  if (!form.title.trim() || !canSubmitFrequency.value) return

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
      frequency: buildFrequencyPayload(),
      target_value: 1, // 目标完成值默认为 1
      archived: false // 新习惯默认未归档
    })

    emit('refresh') // 通知父组件刷新习惯列表
    // 重置表单为初始状态
    form.title = ''
    form.task_time = '08:00'
    form.duration = 10 / 60
    form.frequencyType = 'daily'
    form.weekdays = []
    form.monthDays = []
    emit('update:show', false) // 关闭弹窗
  } catch (e) {
    console.error('Add habit failed in modal', e)
  }
})
</script>
