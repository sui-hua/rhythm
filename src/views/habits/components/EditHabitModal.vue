<script setup>
import { reactive, watch } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

const emit = defineEmits(['close', 'update', 'delete', 'update:show'])

const form = reactive({
  title: ''
})

// 当有传入数据时，更新至表单
watch(() => props.habitData, (newVal) => {
  if (newVal) {
    form.title = newVal.title || ''
  }
}, { immediate: true })

const submit = () => {
  if (!form.title.trim()) return
  
  emit('update', {
    ...props.habitData,
    title: form.title,
  })
  
  emit('update:show', false)
}

const handleDelete = () => {
  emit('delete', props.habitData.id)
  emit('update:show', false)
}
</script>

<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">修改习惯</h1>
          <p class="text-sm text-muted-foreground">调整习惯名称，继续坚持。</p>
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

          <div class="flex flex-col gap-3 pt-2">
            <Button 
              class="w-full h-9 bg-primary text-primary-foreground font-semibold"
              @click="submit"
              :disabled="!form.title.trim() || form.title === habitData?.title"
            >
              保存修改
            </Button>
            <Button 
              variant="outline"
              class="w-full h-9 hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
              @click="handleDelete"
            >
              删除该习惯
            </Button>
            <Button 
              variant="ghost"
              class="w-full h-9 text-muted-foreground"
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
