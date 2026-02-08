<script setup>
import { reactive, watch } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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

const emit = defineEmits(['close', 'add', 'update', 'delete', 'update:show'])

const form = reactive({
  title: '',
  time: '',
  duration: 1.0,
  category: '工作',
  description: ''
})

watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.initialData) {
      form.title = props.initialData.title || ''
      form.time = props.initialData.time || ''
      // Remove 'H' from duration string if it exists and convert to number
      const durationStr = props.initialData.duration || '1.0H'
      form.duration = parseFloat(durationStr.replace('H', ''))
      form.category = props.initialData.category || '工作'
      form.description = props.initialData.description || ''
    } else {
      form.title = ''
      form.time = ''
      form.duration = 1.0
      form.category = '工作'
      form.description = ''
    }
  }
}, { immediate: true })

const submit = () => {
  if (!form.title || !form.time) return
  
  if (props.initialData) {
    emit('update', {
      ...props.initialData,
      ...form
    })
  } else {
    emit('add', {
      ...form,
      completed: false
    })
  }
  emit('update:show', false)
}
</script>

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
            <div class="grid gap-2">
              <label for="time" class="text-sm font-medium leading-none">开始时间</label>
              <Input 
                id="time"
                v-model="form.time"
                placeholder="09:00"
                class="h-9 font-mono"
              />
            </div>
            <div class="grid gap-2">
              <label for="duration" class="text-sm font-medium leading-none">时长 (小时)</label>
              <Input 
                id="duration"
                v-model="form.duration"
                type="number"
                step="0.5"
                class="h-9 font-mono"
              />
            </div>
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
              @click="emit('delete', initialData); emit('update:show', false)"
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
