<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2 text-center">
          <DialogTitle class="text-2xl font-semibold tracking-tight">修改习惯</DialogTitle>
        </div>

        <div class="grid gap-6">
          <div class="grid gap-2">
            <label for="edit-habit-title" class="text-sm font-medium leading-none">习惯名称</label>
            <Input 
              id="edit-habit-title"
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
              id="edit-habit-time"
            />

            <DurationPicker 
              v-model="form.duration" 
              label="习惯时长"
              id="edit-habit-duration"
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
                保存修改
              </Button>
              <Button 
                variant="outline"
                class="w-full h-9"
                @click="$emit('update:show', false)"
              >
                取消
              </Button>
              <div class="flex flex-row gap-3 w-full mt-1">
                <Button 
                  v-if="!habitData?.is_archived"
                  class="flex-1 h-9 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white font-medium transition-colors border-none"
                  @click="handleArchive(true)"
                >
                  归档该习惯
                </Button>
                <Button 
                  v-else
                  class="flex-1 h-9 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white font-medium transition-colors border-none"
                  @click="handleArchive(false)"
                >
                  取消归档
                </Button>
                <Button 
                  title="危险操作：删除无法恢复"
                  class="flex-1 h-9 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-medium transition-colors border-none"
                  @click="handleDelete"
                >
                  删除该习惯
                </Button>
              </div>
            </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
/**
 * EditHabitModal.vue - 修改习惯弹窗组件
 *
 * 功能说明：
 * - 提供一个弹窗界面用于编辑已有习惯的名称、时间和时长
 * - 支持归档/取消归档习惯
 * - 支持删除习惯（危险操作，无法恢复）
 * - 表单数据与 habitData prop 双向同步，弹窗打开时自动填充现有数据
 *
 * 使用方式：
 * - 通过 v-model:show 控制弹窗显示/隐藏
 * - 通过 habitData prop 传入要编辑的习惯对象
 * - 监听 refresh 事件刷新习惯列表
 * - 监听 deleted 事件在删除后重置父组件选中状态
 *
 * 依赖组件：
 * - Dialog/DialogContent/DialogTitle (ui/dialog)
 * - Input (ui/input)
 * - Button (ui/button)
 * - TimePicker (ui/TimePicker.vue) - 时间选择器
 * - DurationPicker (ui/DurationPicker.vue) - 时长选择器
 *
 * 数据库操作：
 * - db.habits.update() 更新习惯信息
 * - db.habits.delete() 删除习惯
 * - 均通过 withLoadingLock 包装防止重复提交
 */
import { computed, reactive, watch } from 'vue'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'
import { withLoadingLock } from '@/utils/throttle'
import {
  createDefaultHabitFrequency,
  normalizeHabitFrequency
} from '@/views/habits/utils/habitFrequency'

const props = defineProps({
  /** 控制弹窗的显示与隐藏状态 */
  show: {
    type: Boolean,
    required: true
  },
  /** 初始化弹窗时传入的现存习惯对象数据 */
  habitData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits([
  'close', // 关闭弹窗事件
  'refresh', // 修改完成后触发的数据刷新请求
  'deleted', // 删除当前习惯后向父级汇报的事件，用于父级重置选中状态
  'update:show' // 支持双向绑定的更新显示状态
])

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

// 弹窗内的可编辑表单数据
const form = reactive({
  title: '', // 习惯名称
  task_time: '', // 计划执行时间 (HH:mm)
  duration: 10 / 60, // 预估时长 (转换为以小时为基数的数字)
  frequencyType: 'daily',
  weekdays: [],
  monthDays: []
})

const canSubmitFrequency = computed(() => {
  if (form.frequencyType === 'weekly') return form.weekdays.length > 0
  if (form.frequencyType === 'monthly') return form.monthDays.length > 0
  return true
})

// 监听传入的 habitData 对象，一旦变化立即重新赋值到表单状态
watch(() => props.habitData, (newVal) => {
  if (newVal) {
    const frequency = normalizeHabitFrequency(newVal.frequency || createDefaultHabitFrequency())
    form.title = newVal.title || ''
    // 若原数据包含时间则截断前5位展示为 HH:mm
    form.task_time = newVal.task_time ? newVal.task_time.substring(0, 5) : '08:00'
    form.duration = (newVal.duration || 10) / 60
    form.frequencyType = frequency.type
    form.weekdays = frequency.type === 'weekly' ? [...frequency.weekdays] : []
    form.monthDays = frequency.type === 'monthly' ? [...frequency.monthDays] : []
  }
}, { immediate: true })

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
 * 提交并保存更改的方法
 */
const submit = withLoadingLock(async () => {
  if (!form.title.trim() || !props.habitData?.id || !canSubmitFrequency.value) return
  
  try {
    await db.habits.update(props.habitData.id, {
      title: form.title,
      task_time: form.task_time || null,
      duration: Math.round((Number(form.duration) || 0) * 60) || 10,
      frequency: buildFrequencyPayload()
    })
    emit('refresh')
    emit('update:show', false)
  } catch (e) {
    console.error('Update habit failed in modal', e)
  }
})

/**
 * 删除当前习惯并通知外部
 */
const handleDelete = withLoadingLock(async () => {
  if (!props.habitData?.id) return
  try {
    await db.habits.delete(props.habitData.id)
    emit('deleted')
    emit('refresh')
    emit('update:show', false)
  } catch (e) {
    console.error('Delete habit failed in modal', e)
  }
})

/**
 * 归档 / 取消归档当前习惯
 */
const handleArchive = withLoadingLock(async (isArchived) => {
  if (!props.habitData?.id) return
  try {
    await db.habits.update(props.habitData.id, {
      is_archived: isArchived
    })
    emit('refresh')
    emit('update:show', false)
  } catch (e) {
    console.error('Archive habit failed in modal', e)
  }
})
</script>
