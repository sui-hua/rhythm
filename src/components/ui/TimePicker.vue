<template>
  <div class="grid gap-2">
    <label v-if="label" :for="id" class="text-sm font-medium leading-none">{{ label }}</label>
    <Popover v-model:open="openTimePopover">
      <PopoverAnchor as-child>
        <div class="relative" ref="triggerContainer" @pointerdown.stop>
          <Input 
            :id="id"
            :model-value="modelValue"
            @update:model-value="$emit('update:modelValue', $event)"
            :placeholder="placeholder"
            class="h-9 font-mono pr-8"
            @click="openTimePopover = true"
            @input="openTimePopover = true"
            @keydown.down.prevent="openTimePopover = true"
            @keyup.enter="$emit('submit')"
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
            :class="modelValue === t && 'bg-accent text-accent-foreground'"
            @click="selectTime(t)"
          >
            {{ t }}
          </Button>
        </div>
        <div class="flex border-t p-1 gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            class="flex-1 h-7 text-xs font-normal" 
            @click="scrollToTime('08:00')"
          >
            上午
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            class="flex-1 h-7 text-xs font-normal" 
            @click="scrollToTime('14:00')"
          >
            下午
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-vue-next'
import { PopoverAnchor } from 'radix-vue'
import { Popover, PopoverContent } from '@/components/ui/popover'

const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, default: 'time-picker' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '08:00' }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const openTimePopover = ref(false)
const triggerContainer = ref(null)
const timeListRef = ref(null)

const timeOptions = []
for (let i = 0; i < 24; i++) {
  const h = String(i).padStart(2, '0')
  timeOptions.push(`${h}:00`)
  timeOptions.push(`${h}:30`)
}

const handleInteractOutside = (event) => {
  const target = event.target
  const actualTarget = event.detail?.originalEvent?.target || target
  if (triggerContainer.value && triggerContainer.value.contains(actualTarget)) {
    event.preventDefault()
  }
}

const scrollToTime = (timeStr) => {
  if (!timeListRef.value) return
  const target = timeListRef.value.querySelector(`[data-time="${timeStr}"]`)
  if (target) {
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

watch(openTimePopover, (open) => {
  if (open) {
    nextTick(() => {
      if (props.modelValue) {
        scrollToTime(props.modelValue)
      } else {
        scrollToTime('08:00')
      }
    })
  }
})

const selectTime = (t) => {
  emit('update:modelValue', t)
  openTimePopover.value = false
}
</script>
