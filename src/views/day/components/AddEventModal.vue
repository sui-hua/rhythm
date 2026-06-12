<template>
  <!--
    AddEventModal — 新增/编辑任务与习惯的弹窗表单
    主要结构：语义标题（sr-only）、标题区块、表单区域（名称/时间时长/描述/分类）、操作按钮
  -->
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <!-- 语义标题开始：仅供屏幕阅读器访问 -->
      <DialogTitle class="sr-only">{{ initialData ? (isHabit ? '编辑习惯' : '编辑任务') : '新增任务' }}</DialogTitle>
      <DialogDescription class="sr-only">{{ initialData ? (isHabit ? '更新您的习惯详情' : '更新您的任务详情') : '填写下方信息以创建新任务' }}</DialogDescription>
      <!-- 语义标题结束 -->

      <!-- 弹窗主体开始 -->
      <div class="flex flex-col gap-6">
        <!-- 标题区块开始：根据编辑/新增、任务/习惯切换文案 -->
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ initialData ? (isHabit ? '编辑习惯' : '编辑任务') : '新增任务' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ initialData ? (isHabit ? '更新您的习惯详情' : '更新您的任务详情') : '填写下方信息以创建新任务' }}
          </p>
        </div>
        <!-- 标题区块结束 -->

        <!-- 表单区域开始 -->
        <div class="grid gap-6">
          <!-- 任务名称输入开始：必填项，blur 时标记为已触摸以控制校验提示时机 -->
          <div class="grid gap-2">
            <label for="title" class="text-sm font-medium leading-none">
              任务名称<span class="text-rose-500">*</span>
            </label>
            <Input
              id="title"
              v-model="eventForm.title"
              placeholder="例如：周会 / 健身"
              class="h-9"
              @blur="markFieldTouched('title')"
            />
            <!-- title 校验失败时显示错误提示 -->
            <p v-if="errors.title" class="text-xs text-rose-500">{{ errors.title }}</p>
          </div>
          <!-- 任务名称输入结束 -->

          <!-- 时间与时长开始：左右两列并排 -->
          <div class="grid grid-cols-2 gap-4">
            <TimePicker
              v-model="eventForm.time"
              label="任务时间"
              id="time"
            />
            <!-- DurationPicker 支持 Enter 直接提交表单 -->
            <DurationPicker
              v-model="eventForm.duration"
              label="任务时长"
              id="duration"
              @submit="submit"
            />
          </div>
          <!-- 时间与时长结束 -->

          <!-- 任务描述开始：仅任务类型显示，习惯无此字段 -->
          <div v-if="!isHabit" class="grid gap-2">
            <label for="description" class="text-sm font-medium leading-none">任务描述</label>
            <Input
              id="description"
              v-model="eventForm.description"
              placeholder="可选详情..."
              class="h-9"
            />
          </div>
          <!-- 任务描述结束 -->

          <!-- 分类选择开始：仅任务类型显示，单选标签组 -->
          <div v-if="!isHabit" class="grid gap-2">
            <label class="text-sm font-medium leading-none">分类</label>
            <div class="flex gap-2 flex-wrap">
              <Button
                v-for="cat in categories"
                :key="cat"
                type="button"
                variant="outline"
                size="sm"
                @click="eventForm.category = cat"
                class="rounded-md text-[10px] font-bold h-7 px-3 transition-all"
                :class="eventForm.category === cat
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-muted-foreground'"
              >
                {{ cat }}
              </Button>
            </div>
          </div>
          <!-- 分类选择结束 -->

          <!-- 操作按钮区开始 -->
          <div class="flex flex-col gap-3 pt-2">
            <!-- 主按钮：表单无效时禁用 -->
            <Button
              class="w-full h-9 bg-primary text-primary-foreground font-semibold"
              @click="submit"
              :disabled="!isValid || isSubmitting"
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
            <!-- 删除按钮：仅编辑模式且为任务类型时显示（习惯不可删除） -->
            <button
              v-if="initialData && !isHabit"
              type="button"
              @click="handleDelete"
              :disabled="isSubmitting"
              class="text-xs text-destructive hover:underline underline-offset-4 mt-2"
            >
              删除此任务
            </button>
          </div>
          <!-- 操作按钮区结束 -->
        </div>
        <!-- 表单区域结束 -->
      </div>
      <!-- 弹窗主体结束 -->
    </DialogContent>
  </Dialog>
</template>
<script lang="ts" setup>
/**
 * AddEventModal — 新增/编辑任务与习惯的弹窗表单组件
 * 数据流：props（show/initialData）→ useAddEventForm（表单状态/校验/提交）→ emit（close/refresh/update:show）
 * 组件仅负责 UI 渲染和事件绑定，所有表单逻辑委托给 useAddEventForm composable
 */

// ── 依赖导入 ──
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { useAddEventForm, type InitialEventData } from '@/views/day/composables/useAddEventForm'

// ── Props ──
// show: 控制弹窗显隐 | initialData: 编辑模式下的初始数据，null 表示新增 | categories: 分类标签列表
const props = defineProps({
  show: Boolean,
  initialData: {
    type: Object as () => InitialEventData | null,
    default: null
  },
  categories: {
    type: Array as () => string[],
    default: () => ['工作', '个人', '会议', '设计', '其他']
  }
})

// ── Emits ──
// close: 关闭弹窗 | refresh: 数据变更后刷新列表 | update:show: v-model 双向绑定
const emit = defineEmits(['close', 'refresh', 'update:show'])

// ── Composables ──
// 表单状态、校验、提交和删除逻辑全部由 composable 管理
const { eventForm, isHabit, errors, isValid, submit, handleDelete, isSubmitting, markFieldTouched } = useAddEventForm(props, emit)
</script>

<style scoped>
</style>
