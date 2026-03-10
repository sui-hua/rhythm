<script setup lang="ts">
import { reactive, watch, computed, onMounted, ref } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'

const categories = ref([])

onMounted(async () => {
  try {
    categories.value = await db.plansCategory.list()
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
})

const props = defineProps<{
  show: boolean
  initialData?: any
}>()

const emit = defineEmits(['add', 'update', 'delete', 'update:show'])

const form = reactive({
  title: '',
  startMonth: new Date().getMonth() + 1,
  endMonth: new Date().getMonth() + 1,
  category_id: '',
  task_time: '09:00',
  duration: 30
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.initialData) {
      form.title = props.initialData.name || props.initialData.title
      form.startMonth = props.initialData.startMonth || new Date().getMonth() + 1
      form.endMonth = props.initialData.endMonth || props.initialData.startMonth || new Date().getMonth() + 1
      form.category_id = props.initialData.category_id || ''
      form.task_time = props.initialData.task_time || '09:00'
      form.duration = props.initialData.duration || 30
    } else {
      form.title = ''
      form.category_id = ''
      form.startMonth = new Date().getMonth() + 1
      form.endMonth = new Date().getMonth() + 1
      form.task_time = '09:00'
      form.duration = 30
    }
  }
})

watch(() => form.startMonth, (newVal) => {
  if (form.endMonth < newVal) {
    form.endMonth = newVal
  }
})

const isEdit = computed(() => !!props.initialData)

const months = [
  { label: '1月', value: 1 }, { label: '2月', value: 2 },
  { label: '3月', value: 3 }, { label: '4月', value: 4 },
  { label: '5月', value: 5 }, { label: '6月', value: 6 },
  { label: '7月', value: 7 }, { label: '8月', value: 8 },
  { label: '9月', value: 9 }, { label: '10月', value: 10 },
  { label: '11月', value: 11 }, { label: '12月', value: 12 }
]

const submit = () => {
  if (!form.title.trim()) return
  
  const payload = {
    title: form.title,
    startMonth: form.startMonth,
    endMonth: form.endMonth,
    category_id: form.category_id || null,
    task_time: form.task_time,
    duration: form.duration,
    status: 'active',
  }

  if (isEdit.value) {
    emit('update', payload)
  } else {
    emit('add', payload)
  }
  
  emit('update:show', false)
}
</script>

<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[450px] p-6 rounded-xl border shadow-lg bg-background">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold tracking-tight">{{ isEdit ? '编辑目标' : '添加新目标' }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <div class="grid gap-2">
          <Label for="goal-title" class="text-xs font-bold uppercase tracking-widest text-muted-foreground">目标名称</Label>
          <Input 
            id="goal-title" 
            v-model="form.title" 
            placeholder="目标名称"
            class="h-10 border shadow-none focus-visible:ring-1"
            @keyup.enter="submit"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">{{ isEdit ? '目标月份' : '开始月份' }}</Label>
            <select 
              v-model="form.startMonth"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="grid gap-2">
            <Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">结束月份</Label>
            <select 
              v-model="form.endMonth"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option v-for="m in months" :key="m.value" :value="m.value" :disabled="m.value < form.startMonth">
                {{ m.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="grid gap-2">
          <Label for="goal-category" class="text-xs font-bold uppercase tracking-widest text-muted-foreground">目标分类</Label>
          <select 
            id="goal-category"
            v-model="form.category_id"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">未分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <TimePicker 
            v-model="form.task_time" 
            label="任务时间"
            id="task-time"
          />
          <DurationPicker 
            v-model="form.duration" 
            label="预计时长 (分钟)"
            id="task-duration"
          />
        </div>
      </div>

      <DialogFooter class="pt-2 flex justify-between items-center w-full">
        <div class="flex-1">
          <button 
            v-if="isEdit"
            type="button"
            @click="emit('delete', props.initialData); emit('update:show', false)"
            class="text-xs text-destructive hover:underline underline-offset-4"
          >
            删除此目标
          </button>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="$emit('update:show', false)" class="h-10 rounded-lg">取消</Button>
          <Button @click="submit" class="h-10 rounded-lg font-bold px-8 shadow-md hover:scale-[1.02] active:scale-95 transition-all">{{ isEdit ? '确认修改' : '确认创建' }}</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
