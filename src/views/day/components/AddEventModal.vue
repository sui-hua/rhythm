<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-vue-next'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PopoverAnchor } from 'radix-vue'
import {
  Popover,
  PopoverContent,
} from '@/components/ui/popover'

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

const openTimePopover = ref(true)
const triggerContainer = ref(null)
const timeListRef = ref(null)

const handleInteractOutside = (event) => {
  if (triggerContainer.value && triggerContainer.value.contains(event.target)) {
    event.preventDefault()
  }
}

const onTimeInputFocus = () => {
  setTimeout(() => {
    openTimePopover.value = true
  }, 100)
}

const scrollToDefaultTime = () => {
  if (!timeListRef.value) return
  const target = timeListRef.value.querySelector('[data-time="08:00"]')
  if (target) {
    target.scrollIntoView({ block: 'center' })
  }
}

watch(openTimePopover, (open) => {
  if (open) {
    nextTick(() => scrollToDefaultTime())
  }
})

const timeOptions = []
for (let i = 0; i < 24; i++) {
  const h = String(i).padStart(2, '0')
  timeOptions.push(`${h}:00`)
  timeOptions.push(`${h}:30`)
}

const selectTime = (t) => {
  form.time = t
  openTimePopover.value = false
}

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
              <Popover v-model:open="openTimePopover">
                <PopoverAnchor as-child>
                  <div class="relative" ref="triggerContainer">
                    <Input 
                      id="time"
                      v-model="form.time"
                      placeholder="08:40"
                      class="h-9 font-mono pr-8"
                      @focus="onTimeInputFocus"
                      @input="openTimePopover = true"
                      @keydown.down.prevent="openTimePopover = true"
                    />
                    <Clock class="absolute right-2.5 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
                  </div>
                </PopoverAnchor>
                <PopoverContent 
                  class="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" 
                  align="start"
                  @open-auto-focus.prevent
                  @interact-outside="handleInteractOutside"
                >
                  <div ref="timeListRef" class="h-[200px] p-1 overflow-y-auto">
                    <Button
                      v-for="t in timeOptions"
                      :key="t"
                      :data-time="t"
                      variant="ghost"
                      class="w-full justify-start font-mono h-8"
                      :class="form.time === t && 'bg-accent text-accent-foreground'"
                      @click="selectTime(t)"
                    >
                      {{ t }}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
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
