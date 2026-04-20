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

/**
 * DurationPicker.vue - 时长选择器组件
 * 
 * 功能说明：
 *   用于选择和输入时长数值，支持两种单位切换：小时(hour)和分钟(minute)。
 *   内部以小数小时（如 1.5 表示 1 小时 30 分钟）作为统一存储格式，
 *   通过 v-model 与父组件进行双向绑定。
 * 
 * 单位转换规则：
 *   - 输入/显示单位为"分钟"时：modelValue = 输入值 / 60
 *   - 输入/显示单位为"小时"时：modelValue = 输入值
 * 
 * 使用示例：
 *   <DurationPicker v-model="duration" label="专注时长" />
 * 
 * @property {number} modelValue - 时长值，单位为小时（如 1.5 表示 1.5 小时）
 * @property {string} [id='duration-picker'] - 关联的 label id
 * @property {string} [label=''] - 标签文本
 * 
 * @emits {update:modelValue} - 当值改变时触发，参数为新的时长值（小时）
 * @emits {submit} - 当按下回车键时触发
 */

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ==================== Props & Emits ====================
// Props：modelValue（时长，小时为单位）、id（关联label）、label（显示标签）
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  id: { type: String, default: 'duration-picker' },
  label: { type: String, default: '' }
})

// Emits：update:modelValue（值变化）、submit（回车提交）
const emit = defineEmits(['update:modelValue', 'submit'])

// ==================== 单位状态 ====================
// durationUnit：当前选择的单位，初始值根据 modelValue 大小决定
// - modelValue > 1 小时 → 默认选"小时"
// - modelValue <= 1 小时 → 默认选"分钟"
const durationUnit = ref(props.modelValue > 1 ? 'hour' : 'minute')

// ==================== 显示值计算属性 ====================
// displayDuration：输入框中显示的数值（带单位转换）
// 
// getter：根据当前单位将 modelValue 转换为显示值
//   - 分钟模式：modelValue * 60（如 0.5 小时 → 显示 30）
//   - 小时模式：直接显示 modelValue
//
// setter：将用户输入的数值转换后 emit
//   - 分钟模式：emit(输入值 / 60)
//   - 小时模式：emit(输入值)
// 空值处理：输入为空或 null 时 emit 0
const displayDuration = computed({
  get() {
    if (durationUnit.value === 'minute') {
      // 分钟模式：将小时转换为分钟显示
      return props.modelValue <= 0 ? '' : Math.round(props.modelValue * 60)
    }
    // 小时模式：直接返回，保留两位小数精度
    return Math.round(props.modelValue * 100) / 100
  },
  set(val) {
    // 空值处理
    if (val === '' || val === null) {
      emit('update:modelValue', 0)
      return
    }
    const num = parseFloat(val) || 0
    if (durationUnit.value === 'minute') {
      // 分钟模式：转换为小时
      emit('update:modelValue', num / 60)
    } else {
      // 小时模式：直接使用
      emit('update:modelValue', num)
    }
  }
})

// ==================== 单位切换逻辑 ====================
// switchingUnit：防止单位切换时触发值变化的 watcher（避免循环）
let switchingUnit = false

/**
 * 单位切换 watcher
 * 
 * 目标：切换单位时尝试维持输入框的"字面值"不变
 * 
 * 示例：用户输入 "30" 并选择"分钟"（即 30 分钟 = 0.5 小时）
 *       切换到"小时"后，输入框应显示 "0.5"（值不变，只是单位变了）
 * 
 * 实现步骤：
 * 1. 记录切换前的显示值（previousDisplayValue）
 * 2. 根据新单位 emit 调整后的 modelValue
 * 3. 使用 nextTick 确保 DOM 更新完成后再重置锁
 */
watch(durationUnit, async (newUnit, oldUnit) => {
  if (switchingUnit) return  // 防止循环
  if (newUnit === oldUnit) return
  
  switchingUnit = true
  // 步骤1：获取旧状态下的显示数值
  //   - 分钟模式：modelValue * 60
  //   - 小时模式：直接用 modelValue
  const previousDisplayValue = (oldUnit === 'minute' ? Math.round(props.modelValue * 60) : props.modelValue)
  
  // 步骤2：根据新单位 emit 调整后的值
  //   - 切到小时：直接用显示值（因为小时模式直接显示数值）
  //   - 切到分钟：显示值 / 60（转换为小时存储）
  if (newUnit === 'hour') {
    emit('update:modelValue', previousDisplayValue)
  } else {
    emit('update:modelValue', previousDisplayValue / 60)
  }
  
  await nextTick()
  switchingUnit = false
})

// ==================== 外部重置同步 ====================
// modelValue watcher：监听外部值变化，同步单位选择
// 
// 场景：当父组件重置 modelValue（如从 0 变成 0.5）时，
//       需要根据新值大小重新判断默认单位
watch(() => props.modelValue, (newVal, oldVal) => {
  if (switchingUnit) return
  // 仅在初始加载时（oldVal 为 undefined 或 0）自动调整单位
  if (oldVal === undefined || oldVal === 0) {
    durationUnit.value = newVal > 1 ? 'hour' : 'minute'
  }
})
</script>

<style scoped>
</style>
