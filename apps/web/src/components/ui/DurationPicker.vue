<template>
  <!--
    DurationPicker — 时长选择器
    主要结构：标签、数值输入框、单位切换下拉框
  -->
  <div class="grid gap-2">
    <!-- 标签：关联输入框的无障碍标识 -->
    <label v-if="label" :for="id" class="text-sm font-medium leading-none">{{ label }}</label>
    <div class="flex w-full">
      <!-- 数值输入框：根据当前单位显示小时或分钟值 -->
      <Input
        :id="id"
        :name="id"
        v-model="displayDuration"
        type="number"
        min="0"
        :step="durationUnit === 'hour' ? 0.5 : 10"
        class="h-9 font-mono flex-1 rounded-r-none focus-visible:z-10 shadow-none"
        @keyup.enter="$emit('submit')"
      />
      <!-- 单位切换：小时 / 分钟 -->
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

<script lang="ts" setup>
/**
 * DurationPicker — 时长选择器组件
 *
 * 用于输入时长数值，支持小时和分钟两种单位切换。
 * 内部以小数小时（如 1.5 表示 1 小时 30 分钟）作为统一存储格式，
 * 通过 v-model 与父组件进行双向绑定。
 *
 * 单位转换规则：
 * - 分钟模式：显示值 = modelValue * 60，emit 时 / 60
 * - 小时模式：直接对应，不做转换
 */

// ── 依赖导入 ──
import { ref, computed, watch, nextTick } from 'vue'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// ── Props & Emits ──
// modelValue：时长值，单位为小时（如 1.5 表示 1.5 小时）
// id：关联 label 的输入框 ID
// label：显示标签文本
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  id: { type: String, default: 'duration-picker' },
  label: { type: String, default: '' }
})

// update:modelValue：值变化时触发
// submit：回车提交时触发
const emit = defineEmits(['update:modelValue', 'submit'])

// ── 状态 ──
// 当前选择的单位，初始值根据 modelValue 大小自动判断
// 大于 1 小时默认选"小时"，否则默认选"分钟"
const durationUnit = ref(props.modelValue > 1 ? 'hour' : 'minute')

// ── 计算属性 ──
// 输入框显示值，自动在小时和分钟之间做单位转换
const displayDuration = computed({
  // 根据当前单位将 modelValue 转换为显示值
  get() {
    if (durationUnit.value === 'minute') {
      // 分钟模式：将小时转换为分钟，<= 0 时显示空字符串
      return props.modelValue <= 0 ? '' : Math.round(props.modelValue * 60)
    }
    // 小时模式：保留两位小数精度
    return Math.round(props.modelValue * 100) / 100
  },
  // 将用户输入转换回小时单位后 emit
  set(val: string | number) {
    // 空值或 null 统一归零
    if (val === '' || val === null) {
      emit('update:modelValue', 0)
      return
    }
    const num = parseFloat(String(val)) || 0
    if (durationUnit.value === 'minute') {
      emit('update:modelValue', num / 60)
    } else {
      emit('update:modelValue', num)
    }
  }
})

// ── 单位切换逻辑 ──
// 防止单位切换时触发 modelValue watcher 产生循环更新
let switchingUnit = false

// 切换单位时维持输入框的字面值不变（值不变，只是单位变了）
// 例如：输入 "30" 分钟 = 0.5 小时，切到小时后显示 "0.5"
watch(durationUnit, async (newUnit, oldUnit) => {
  if (switchingUnit) return
  if (newUnit === oldUnit) return

  switchingUnit = true
  // 获取旧单位下的显示数值
  const previousDisplayValue = (oldUnit === 'minute' ? Math.round(props.modelValue * 60) : props.modelValue)

  // 根据新单位 emit 调整后的值
  if (newUnit === 'hour') {
    emit('update:modelValue', previousDisplayValue)
  } else {
    emit('update:modelValue', previousDisplayValue / 60)
  }

  // 等待 DOM 更新完成后再释放锁，避免中间状态触发 watcher
  await nextTick()
  switchingUnit = false
})

// ── 外部重置同步 ──
// 监听父组件重置 modelValue 时，根据新值大小重新判断默认单位
watch(() => props.modelValue, (newVal, oldVal) => {
  if (switchingUnit) return
  // 初始加载或值跨越阈值时自动切换单位
  if (oldVal === undefined || oldVal === 0) {
    durationUnit.value = newVal > 1 ? 'hour' : 'minute'
  } else if (newVal > 1 && durationUnit.value === 'minute') {
    durationUnit.value = 'hour'
  } else if (newVal <= 1 && durationUnit.value === 'hour') {
    durationUnit.value = 'minute'
  }
})
</script>

<style scoped>
</style>
