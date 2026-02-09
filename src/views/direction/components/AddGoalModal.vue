<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  show: boolean
  initialData?: any
}>()

const emit = defineEmits(['add', 'update', 'update:show'])

const form = reactive({
  title: '',
  startMonth: new Date().getMonth() + 1,
  endMonth: new Date().getMonth() + 1,
  category: ''
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.initialData) {
      form.title = props.initialData.name || props.initialData.title
      form.startMonth = props.initialData.startMonth || new Date().getMonth() + 1
      form.endMonth = props.initialData.endMonth || props.initialData.startMonth || new Date().getMonth() + 1
      form.category = props.initialData.category || ''
    } else {
      form.title = ''
      form.category = ''
      form.startMonth = new Date().getMonth() + 1
      form.endMonth = new Date().getMonth() + 1
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
    category: form.category,
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
          <Input id="goal-category" v-model="form.category" placeholder="目标分类" class="h-10 border shadow-none" />
        </div>
      </div>

      <DialogFooter class="pt-2">
        <Button variant="outline" @click="$emit('update:show', false)" class="h-10 rounded-lg">取消</Button>
        <Button @click="submit" class="h-10 rounded-lg font-bold px-8 shadow-md hover:scale-[1.02] active:scale-95 transition-all">{{ isEdit ? '确认修改' : '确认创建' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
