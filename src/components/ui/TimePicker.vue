<template>
  <div class="grid gap-2">
    <label v-if="label" :for="id" class="text-sm font-medium leading-none">{{ label }}</label>
    <Popover v-model:open="openTimePopover">
      <PopoverAnchor as-child>
        <div class="relative" ref="triggerContainer" @pointerdown.stop>
          <Input 
            :id="id"
            :name="id"
            :model-value="displayValue"
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
/**
 * TimePicker 时间选择器组件
 *
 * 提供一个带 Popover 弹窗的时间选择器，支持从预设的时间选项中选择时间。
 * 时间选项以 30 分钟为间隔，覆盖 00:00 至 23:30 共 48 个时间点。
 *
 * @description
 * 该组件包含以下功能：
 * - 支持 v-model:modelValue 双向绑定，格式为 HH:mm
 * - 点击输入框或按下方向键↓时打开 Popover 时间选择面板
 * - 时间列表自动滚动至当前选中时间或默认时间（08:00）
 * - 提供"上午"和"下午"快捷按钮，快速定位到 08:00 和 14:00
 * - 防止点击触发器本身时意外关闭 Popover
 * - 自动去除 modelValue 中可能存在的秒数部分（只保留 HH:mm）
 *
 * @prop {string} modelValue - 当前选中时间，格式为 HH:mm 或 HH:mm:ss
 * @prop {string} id - 输入框 ID，用于无障碍访问，默认 'time-picker'
 * @prop {string} label - 可选的标签文本，显示在输入框上方
 * @prop {string} placeholder - 占位符文本，默认 '08:00'
 *
 * @emit {update:modelValue} - 当用户选择时间时触发，参数为选中的时间字符串 (HH:mm)
 * @emit {submit} - 当用户在输入框按下回车键时触发
 *
 * @example
 * <TimePicker v-model="selectedTime" label="选择时间" />
 */
import { ref, watch, nextTick, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-vue-next'
import { PopoverAnchor } from 'radix-vue'
import { Popover, PopoverContent } from '@/components/ui/popover'

/**
 * 组件属性定义
 * @prop {string} modelValue - 当前选中时间，格式为 HH:mm
 * @prop {string} id - 输入框 ID，用于无障碍访问
 * @prop {string} label - 可选的标签文本
 * @prop {string} placeholder - 占位符文本
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, default: 'time-picker' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '08:00' }
})

const emit = defineEmits(['update:modelValue', 'submit'])

/**
 * 计算属性：显示值
 * 仅显示 HH:mm 格式，去除可能的秒数部分
 */
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  // 仅保留 HH:mm 格式，去除秒数
  return props.modelValue.length > 5 ? props.modelValue.substring(0, 5) : props.modelValue
})

/**
 * 控制 Popover 打开/关闭的状态
 */
const openTimePopover = ref(false)

/**
 * 触发器容器引用，用于检测点击是否在触发器区域内
 */
const triggerContainer = ref(null)

/**
 * 时间列表容器引用，用于滚动定位
 */
const timeListRef = ref(null)

/**
 * 时间选项数组，包含 24 小时内每 30 分钟一个时间点
 * 共 48 个选项，格式为 HH:mm
 */
const timeOptions = []
for (let i = 0; i < 24; i++) {
  const h = String(i).padStart(2, '0')
  timeOptions.push(`${h}:00`)
  timeOptions.push(`${h}:30`)
}

/**
 * 处理 Popover 外部点击事件
 * 如果点击发生在触发器容器内，则阻止 Popover 关闭
 * 这样可以防止用户点击输入框时意外关闭已打开的选择面板
 *
 * @param {CustomEvent} event - Radix Vue 的 interact-outside 事件
 */
const handleInteractOutside = (event) => {
  const target = event.target
  const actualTarget = event.detail?.originalEvent?.target || target
  if (triggerContainer.value && triggerContainer.value.contains(actualTarget)) {
    event.preventDefault()
  }
}

/**
 * 滚动时间列表到指定时间位置
 * 使用 smooth 滚动行为，使列表平滑滚动到目标时间选项
 *
 * @param {string} timeStr - 目标时间字符串，格式为 HH:mm
 */
const scrollToTime = (timeStr) => {
  if (!timeListRef.value) return
  const target = timeListRef.value.querySelector(`[data-time="${timeStr}"]`)
  if (target) {
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

/**
 * 监听 Popover 打开状态
 * 当 Popover 打开时，下一个 tick 执行滚动操作
 * 如果已有选中时间则滚动到该时间，否则默认滚动到 08:00
 */
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

/**
 * 选择指定时间
 * 发射 update:modelValue 事件更新绑定值，并关闭 Popover
 *
 * @param {string} t - 选中的时间字符串，格式为 HH:mm
 */
const selectTime = (t) => {
  emit('update:modelValue', t)
  openTimePopover.value = false
}
</script>
