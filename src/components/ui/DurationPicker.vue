<template>
  <div class="grid gap-2">
    <label v-if="label" :for="id" class="text-sm font-medium leading-none">{{ label }}</label>
    <div class="flex w-full">
      <Input 
        :id="id"
        v-model="displayDuration"
        type="number"
        min="0"
        :step="durationUnit === 'hour' ? 0.5 : 10"
        class="h-9 font-mono flex-1 rounded-r-none focus-visible:z-10 shadow-none"
        @keyup.enter="$emit('submit')"
      />
      <Select v-model="durationUnit">
        <SelectTrigger class="w-[80px] h-9 rounded-l-none border-l-0 focus:z-10 focus:ring-offset-0 bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent class="w-[80px] min-w-[80px]">
          <SelectItem value="hour" :show-check="false">小时</SelectItem>
          <SelectItem value="minute" :show-check="false">分钟</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  id: { type: String, default: 'duration-picker' },
  label: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const durationUnit = ref(props.modelValue > 1 ? 'hour' : 'minute')

const displayDuration = computed({
  get() {
    if (durationUnit.value === 'minute') {
      return props.modelValue <= 0 ? '' : Math.round(props.modelValue * 60)
    }
    return Math.round(props.modelValue * 100) / 100
  },
  set(val) {
    if (val === '' || val === null) {
      emit('update:modelValue', 0)
      return
    }
    let num = parseFloat(val)
    if (isNaN(num)) return
    if (num < 0) num = 0
    
    if (durationUnit.value === 'minute') {
      emit('update:modelValue', num / 60)
    } else {
      emit('update:modelValue', num)
    }
  }
})

// 当外部的值大幅变更时（比如加载不同任务），自动调整单位
watch(() => props.modelValue, (newVal) => {
  if (newVal > 1 && durationUnit.value === 'minute') {
    durationUnit.value = 'hour'
  } else if (newVal > 0 && newVal <= 1 && durationUnit.value === 'hour') {
    durationUnit.value = 'minute'
  }
}, { immediate: true })
</script>
