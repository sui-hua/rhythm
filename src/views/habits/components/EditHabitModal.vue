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

            <div class="flex flex-col gap-3 pt-2">
              <Button 
                class="w-full h-9 bg-primary text-primary-foreground font-semibold"
                @click="submit"
                :disabled="!form.title.trim() || (form.title === habitData?.title && form.task_time === (habitData?.task_time || '') && Math.round(form.duration * 60) === (habitData?.duration || 10))"
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
 * 修改习惯弹窗组件 (EditHabitModal.vue)
 * 提供一个弹窗用于编辑已有习惯各项属性或者直接执行删除习惯。
 */
import { reactive, watch } from 'vue'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'

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

// 弹窗内的可编辑表单数据
const form = reactive({
  title: '', // 习惯名称
  task_time: '', // 计划执行时间 (HH:mm)
  duration: 10 / 60 // 预估时长 (转换为以小时为基数的数字)
})

// 监听传入的 habitData 对象，一旦变化立即重新赋值到表单状态
watch(() => props.habitData, (newVal) => {
  if (newVal) {
    form.title = newVal.title || ''
    // 若原数据包含时间则截断前5位展示为 HH:mm
    form.task_time = newVal.task_time ? newVal.task_time.substring(0, 5) : ''
    form.duration = (newVal.duration || 10) / 60
  }
}, { immediate: true })

/**
 * 提交并保存更改的方法
 */
const submit = async () => {
  if (!form.title.trim()) return
  if (!props.habitData?.id) return
  
  try {
    await db.habits.update(props.habitData.id, {
      title: form.title,
      task_time: form.task_time || null,
      duration: Math.round((Number(form.duration) || 0) * 60) || 10
    })
    emit('refresh')
    emit('update:show', false)
  } catch (e) {
    console.error('Update habit failed in modal', e)
  }
}

/**
 * 删除当前习惯并通知外部
 */
const handleDelete = async () => {
  if (!props.habitData?.id) return
  try {
    await db.habits.delete(props.habitData.id)
    emit('deleted')
    emit('refresh')
    emit('update:show', false)
  } catch (e) {
    console.error('Delete habit failed in modal', e)
  }
}

/**
 * 归档 / 取消归档当前习惯
 */
const handleArchive = async (isArchived) => {
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
}
</script>