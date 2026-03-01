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
            <Button 
              title="危险操作：删除无法恢复"
              class="w-full h-9 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-medium transition-colors border-none mt-1"
              @click="handleDelete"
            >
              删除该习惯
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  habitData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'refresh', 'deleted', 'update:show'])

const form = reactive({
  title: '',
  task_time: '',
  duration: 10 / 60
})

// 当有传入数据时，更新至表单
watch(() => props.habitData, (newVal) => {
  if (newVal) {
    form.title = newVal.title || ''
    form.task_time = newVal.task_time || ''
    form.duration = (newVal.duration || 10) / 60
  }
}, { immediate: true })

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
</script>