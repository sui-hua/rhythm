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
import { ref, computed, watch, nextTick } from 'vue'
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
    const num = parseFloat(val) || 0
    if (durationUnit.value === 'minute') {
      emit('update:modelValue', num / 60)
    } else {
      emit('update:modelValue', num)
    }
  }
})

// 当单位改变时，我们尝试维持输入框中的“字面数值”不变
let switchingUnit = false
watch(durationUnit, async (newUnit, oldUnit) => {
  if (switchingUnit) return
  if (newUnit === oldUnit) return
  
  switchingUnit = true
  // 1. 获取旧状态下的显示数值（例如 30 分钟 -> 30）
  const previousDisplayValue = (oldUnit === 'minute' ? Math.round(props.modelValue * 60) : props.modelValue)
  
  // 2. 根据新单位 emit 调整后的 modelValue
  if (newUnit === 'hour') {
    emit('update:modelValue', previousDisplayValue)
  } else {
    emit('update:modelValue', previousDisplayValue / 60)
  }
  
  await nextTick()
  switchingUnit = false
})

// 初始化/外部重置：如果 props.modelValue 发生了根本性改变（例如从 0 变成 0.5），同步单位
watch(() => props.modelValue, (newVal, oldVal) => {
  if (switchingUnit) return
  // 如果是从 0 或 undefined 加载出来的初始值，强制根据大小定一次单位
  if (oldVal === undefined || oldVal === 0) {
    durationUnit.value = newVal > 1 ? 'hour' : 'minute'
  }
})
</script>

<style scoped>
</style>
