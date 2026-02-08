<script setup lang="ts">
import { reactive } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close', 'add', 'update:show'])

const form = reactive({
  title: ''
})

const submit = () => {
  if (!form.title.trim()) return
  
  emit('add', {
    title: form.title,
    frequency: { type: 'daily' },
    target_value: 1,
    archived: false,
    monthCount: 0,
    total: 0,
    completionRate: 0,
    streak: 0,
    completedDays: []
  })
  
  form.title = ''
  emit('update:show', false)
}
</script>

<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">添加新习惯</h1>
          <p class="text-sm text-muted-foreground">开始你的新习惯，坚持成就不凡。</p>
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
