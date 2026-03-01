<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ initialData ? '编辑任务' : '新增任务' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ initialData ? '更新您的任务详情' : '填写下方信息以创建新任务' }}
          </p>
        </div>

        <div class="grid gap-6">
          <!-- Title Group -->
          <div class="grid gap-2">
            <label for="title" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">任务名称</label>
            <Input 
              id="title"
              v-model="form.title"
              placeholder="例如：周会 / 健身"
              class="h-9"
            />
          </div>

          <!-- Time & Duration Group -->
          <div class="grid grid-cols-2 gap-4">
            <TimePicker 
              v-model="form.time" 
              label="任务时间"
              id="time"
            />
            <DurationPicker 
              v-model="form.duration" 
              label="任务时长"
              id="duration"
              @submit="submit"
            />
          </div>

          <!-- Description Group -->
          <div class="grid gap-2">
            <label for="description" class="text-sm font-medium leading-none">任务描述</label>
            <Input 
              id="description"
              v-model="form.description"
              placeholder="可选详情..."
              class="h-9"
            />
          </div>

          <!-- Category Group -->
          <div class="grid gap-2">
            <label class="text-sm font-medium leading-none">分类</label>
            <div class="flex gap-2 flex-wrap">
              <Button 
                v-for="cat in categories" 
                :key="cat"
                type="button"
                variant="outline"
                size="sm"
                @click="form.category = cat"
                class="rounded-md text-[10px] font-bold h-7 px-3 transition-all"
                :class="[
                  form.category === cat 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'text-muted-foreground'
                ]"
              >
                {{ cat }}
              </Button>
            </div>
          </div>

          <div class="flex flex-col gap-3 pt-2">
            <Button 
              class="w-full h-9 bg-primary text-primary-foreground font-semibold"
              @click="submit"
              :disabled="!form.title || !form.time"
            >
              {{ initialData ? '保存修改' : '确认创建' }}
            </Button>
            <Button 
              variant="outline"
              class="w-full h-9"
              @click="$emit('update:show', false)"
            >
              取消
            </Button>
            <button 
              v-if="initialData"
              type="button"
              @click="handleDelete"
              class="text-xs text-destructive hover:underline underline-offset-4 mt-2"
            >
              删除此任务
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, reactive, watch, nextTick, computed } from 'vue'
import { db } from '@/services/database'
import { useAuthStore } from '@/stores/authStore'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'

const props = defineProps({
  show: Boolean,
  initialData: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => ['工作', '个人', '会议', '设计', '其他']
  }
})

import { useDateStore } from '@/stores/dateStore'
const dateStore = useDateStore()

const emit = defineEmits(['close', 'refresh', 'update:show'])

const authStore = useAuthStore()

const form = reactive({
  title: '',
  time: '',
  duration: 1.0,
  category: '工作',
  description: ''
})

const lastUsedTime = '08:00'

watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.initialData) {
      form.title = props.initialData.title || ''
      form.time = props.initialData.time || ''
      // Remove 'H' from duration string if it exists and convert to number
      const durationStr = props.initialData.duration || '1.0H'
      
      // Use raw duration if available to avoid precision loss from toFixed(1)
      let durationVal
      if (props.initialData.rawDuration !== undefined) {
        durationVal = props.initialData.rawDuration
      } else {
        durationVal = parseFloat(String(durationStr).replace('H', ''))
      }
      
      form.duration = durationVal
      form.category = props.initialData.category || '工作'
      form.description = props.initialData.description || ''
    } else {
      form.title = ''
      form.time = lastUsedTime
      form.duration = 0.5
      form.category = '工作'
      form.description = ''
    }
  }
}, { immediate: true })

const submit = async () => {
  if (!form.title || !form.time) return
  
  const [hours, minutes] = form.time.split(':').map(Number)
  const durationValue = parseFloat(form.duration)
  
  const year = dateStore.currentDate.getFullYear()
  const month = dateStore.currentDate.getMonth()
  const day = dateStore.currentDate.getDate()
  
  const startTime = new Date(year, month, day, hours, minutes)
  const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000)
  
  try {
    if (props.initialData) {
      // 执行更新操作
      await db.tasks.update(props.initialData.id, {
        title: form.title,
        description: form.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      })
    } else {
      lastUsedTime = form.time
      const userId = authStore.userId
      if (!userId) {
        console.error('User not authenticated')
        return
      }
      // 执行新增操作
      await db.tasks.create({
        user_id: userId,
        title: form.title,
        description: form.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        completed: false,
      })
    }
    // 通知父组件刷新列表
    emit('refresh')
  } catch (e) {
    console.error('Failed to save task', e)
  }
  
  emit('update:show', false)
}

const handleDelete = async () => {
  if (props.initialData) {
    try {
      await db.tasks.delete(props.initialData.id)
      emit('refresh')
    } catch (e) {
      console.error('Failed to delete task', e)
    }
  }
  emit('update:show', false)
}
</script>