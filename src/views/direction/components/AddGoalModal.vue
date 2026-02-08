<script setup lang="ts">
import { reactive, computed } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  show: boolean
  plans: any[]
}>()

const emit = defineEmits(['close', 'add', 'update:show'])

const form = reactive({
  title: '',
  plan_id: '',
  start_month: 1,
  end_month: 12
})

// Initialize plan_id if plans are available
if (props.plans?.length > 0) {
  form.plan_id = props.plans[0].id
}

const months = [
  { label: '1月', value: 1 }, { label: '2月', value: 2 },
  { label: '3月', value: 3 }, { label: '4月', value: 4 },
  { label: '5月', value: 5 }, { label: '6月', value: 6 },
  { label: '7月', value: 7 }, { label: '8月', value: 8 },
  { label: '9月', value: 9 }, { label: '10月', value: 10 },
  { label: '11月', value: 11 }, { label: '12月', value: 12 }
]

const submit = () => {
  if (!form.title.trim() || !form.plan_id) return
  
  emit('add', {
    title: form.title,
    plan_id: form.plan_id,
    start_month: form.start_month,
    end_month: form.end_month,
    status: 'active',
    priority: 2
  })
  
  form.title = ''
  emit('update:show', false)
}
</script>

<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[450px] p-6 rounded-xl border shadow-lg bg-background">
      <DialogHeader>
        <DialogTitle class="text-xl font-bold tracking-tight">添加新目标</DialogTitle>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <div class="grid gap-2">
          <Label for="goal-title" class="text-xs font-bold uppercase tracking-widest text-muted-foreground">目标名称</Label>
          <Input 
            id="goal-title" 
            v-model="form.title" 
            placeholder="例如：核心引擎 V4 开发"
            class="h-10 border shadow-none focus-visible:ring-1"
            @keyup.enter="submit"
          />
        </div>

        <div class="grid gap-2">
          <Label for="plan-category" class="text-xs font-bold uppercase tracking-widest text-muted-foreground">所属方向</Label>
          <select 
            id="plan-category" 
            v-model="form.plan_id"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option v-for="plan in plans" :key="plan.id" :value="plan.id">
              {{ plan.title }}
            </option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">起始月份</Label>
            <select 
              v-model="form.start_month"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="grid gap-2">
            <Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">结束月份</Label>
            <select 
              v-model="form.end_month"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
        </div>
      </div>

      <DialogFooter class="pt-2">
        <Button variant="outline" @click="$emit('update:show', false)" class="h-10 rounded-lg">取消</Button>
        <Button @click="submit" class="h-10 rounded-lg font-bold px-8 shadow-md hover:scale-[1.02] active:scale-95 transition-all">确认创建</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
