<template>
  <!--
    TimePicker — 时间选择器
    主要结构：标签、输入框（带时钟图标）、Popover 时间列表面板
  -->
  <div class="grid gap-2">
    <!-- 标签：关联输入框的无障碍标识 -->
    <label v-if="label" :for="id" class="text-sm font-medium leading-none">{{ label }}</label>
    <Popover v-model:open="openTimePopover">
      <PopoverAnchor as-child>
        <div class="relative" ref="triggerContainer" @pointerdown.stop>
          <!-- 时间输入框：点击或按方向键↓打开选择面板 -->
          <Input
            :id="id"
            :name="id"
            :model-value="displayValue"
            @update:model-value="handleInput"
            :placeholder="placeholder"
            class="h-9 font-mono pr-8"
            @click="openTimePopover = true"
            @input="openTimePopover = true"
            @keydown.down.prevent="openTimePopover = true"
            @keyup.enter="$emit('submit')"
          />
          <!-- 时钟图标：视觉装饰 -->
          <Clock class="absolute right-2.5 top-2.5 h-4 w-4 opacity-50 pointer-events-none" />
        </div>
      </PopoverAnchor>
      <!-- 时间选择面板 -->
      <PopoverContent
        class="w-[var(--reka-popover-trigger-width)] p-0 z-[320]"
        align="start"
        @open-auto-focus.prevent
        @interact-outside="handleInteractOutside"
      >
        <!-- 时间列表：每 30 分钟一个选项，共 48 个 -->
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
        <!-- 快捷跳转：上午 / 下午 -->
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

<script lang="ts" setup>
/**
 * TimePicker — 时间选择器组件
 *
 * 带 Popover 弹窗的时间选择器，时间选项以 30 分钟为间隔覆盖 00:00 ~ 23:30。
 * 支持 v-model 双向绑定（HH:mm 格式），提供上午/下午快捷跳转。
 */

// ── 依赖导入 ──
import { ref, watch, nextTick, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-vue-next'
import { PopoverAnchor } from 'reka-ui'
import { Popover, PopoverContent } from '@/components/ui/popover'

// ── Props & Emits ──
// modelValue：当前选中时间，格式 HH:mm 或 HH:mm:ss
// id：输入框 ID，用于无障碍访问
// label：可选标签文本，显示在输入框上方
// placeholder：占位符文本
const props = defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, default: 'time-picker' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '08:00' }
})

// update:modelValue：选择时间时触发
// submit：回车提交时触发
const emit = defineEmits(['update:modelValue', 'submit'])

// ── 状态 ──
// Popover 打开/关闭状态
const openTimePopover = ref(false)

// 触发器容器引用，用于检测外部点击是否在触发器区域内
const triggerContainer = ref<HTMLElement | null>(null)

// 时间列表容器引用，用于滚动定位
const timeListRef = ref<HTMLElement | null>(null)

// ── 计算属性 ──
// 显示值：仅保留 HH:mm 格式，自动去除可能的秒数部分
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return props.modelValue.length > 5 ? props.modelValue.substring(0, 5) : props.modelValue
})

// ── 时间选项 ──
// 24 小时内每 30 分钟一个选项，共 48 个
const timeOptions: string[] = []
for (let i = 0; i < 24; i++) {
  const h = String(i).padStart(2, '0')
  timeOptions.push(`${h}:00`)
  timeOptions.push(`${h}:30`)
}

// ── 方法 ──
// 处理 Popover 外部点击：点击发生在触发器容器内时阻止关闭
// 防止用户点击输入框时意外关闭已打开的选择面板
// Radix Vue 的 interact-outside 事件会将原始 DOM 事件包装在 detail.originalEvent 中
interface InteractOutsideEvent extends Event {
  detail?: { originalEvent?: Event }
}
const handleInteractOutside = (event: Event) => {
  const target = event.target
  const detail = (event as InteractOutsideEvent).detail
  const actualTarget = detail?.originalEvent?.target || target
  if (triggerContainer.value && triggerContainer.value.contains(actualTarget as Node)) {
    event.preventDefault()
  }
}

// 滚动时间列表到指定时间位置
const scrollToTime = (timeStr: string) => {
  if (!timeListRef.value) return
  const target = timeListRef.value.querySelector(`[data-time="${timeStr}"]`)
  if (target) {
    target.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
}

// 选择指定时间：更新绑定值并关闭 Popover
const selectTime = (t: string) => {
  emit('update:modelValue', t)
  openTimePopover.value = false
}

// 输入校验：仅允许 HH:mm 格式（数字和冒号，最多 5 字符）透传
const handleInput = (val: string | number) => {
  const strVal = String(val)
  if (!strVal) {
    emit('update:modelValue', '')
    return
  }
  if (/^\d{0,2}:?\d{0,2}$/.test(strVal) && strVal.length <= 5) {
    emit('update:modelValue', strVal)
  }
}

// ── Watch ──
// Popover 打开时自动滚动到当前选中时间，默认滚动到 08:00
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
</script>
