<template>
  <!--
    AddEventModal — 新增/编辑任务与习惯的弹窗表单
    主要结构：语义标题（sr-only）、标题区块、表单区域（名称/时间时长/描述/分类）、操作按钮
  -->
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <!-- 语义标题开始：仅供屏幕阅读器访问 -->
      <DialogTitle class="sr-only">{{ dialogTitle }}</DialogTitle>
      <DialogDescription class="sr-only">{{ dialogDescription }}</DialogDescription>
      <!-- 语义标题结束 -->

      <!-- 弹窗主体开始 -->
      <div class="flex flex-col gap-6">
        <!-- 标题区块开始：根据编辑/新增、任务/习惯切换文案 -->
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ dialogTitle }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ dialogDescription }}
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
          <div v-if="!isHabit && !isGoalDay" class="grid gap-2">
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
            <div class="flex items-center justify-between gap-3">
              <label class="text-sm font-medium leading-none">分类</label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-7 px-2 text-xs gap-1.5 text-muted-foreground"
                @click="managingCategories = !managingCategories"
              >
                <Check v-if="managingCategories" class="w-3.5 h-3.5" />
                <Settings2 v-else class="w-3.5 h-3.5" />
                {{ managingCategories ? '完成' : '管理' }}
              </Button>
            </div>
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

            <!-- 分类管理区开始：新增/删除任务快捷分类，分类列表保存到本地 -->
            <div v-if="managingCategories" class="grid gap-3 rounded-md border border-border bg-muted/30 p-3">
              <div class="flex gap-2">
                <Input
                  v-model="newCategoryName"
                  placeholder="输入新分类"
                  class="h-8"
                  @keyup.enter="addCategory"
                />
                <Button
                  type="button"
                  size="sm"
                  class="h-8 px-3 gap-1.5"
                  @click="addCategory"
                >
                  <Plus class="w-3.5 h-3.5" />
                  添加
                </Button>
              </div>

              <div class="grid gap-1">
                <div
                  v-for="cat in categories"
                  :key="`manage-${cat}`"
                  class="flex items-center justify-between gap-3 rounded px-2 py-1.5 text-sm hover:bg-background"
                >
                  <span class="font-medium">{{ cat }}</span>
                  <button
                    type="button"
                    class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    :aria-label="`删除分类 ${cat}`"
                    @click="removeCategory(cat)"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
            <!-- 分类管理区结束 -->
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
              {{ isGoalDay ? '删除此目标任务' : '删除此任务' }}
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
import { computed } from 'vue'
import { Check, Plus, Settings2, Trash2 } from 'lucide-vue-next'
import { useAddEventForm, type InitialEventData } from '@/views/day/composables/useAddEventForm'
import { DEFAULT_TASK_CATEGORIES, useTaskCategories } from '@/views/day/composables/useTaskCategories'

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
    default: () => DEFAULT_TASK_CATEGORIES
  }
})

// ── Emits ──
// close: 关闭弹窗 | refresh: 数据变更后刷新列表 | update:show: v-model 双向绑定
const emit = defineEmits(['close', 'refresh', 'update:show'])

// ── Composables ──
// 表单状态、校验、提交和删除逻辑全部由 composable 管理
const { eventForm, isHabit, isGoalDay, errors, isValid, submit, handleDelete, isSubmitting, markFieldTouched } = useAddEventForm(props, emit)

// 弹窗主标题：根据数据来源区分任务、目标任务和习惯
const dialogTitle = computed(() => {
  if (!props.initialData) return '新增任务'
  if (isHabit.value) return '编辑习惯'
  if (isGoalDay.value) return '编辑目标任务'
  return '编辑任务'
})

// 弹窗说明文字：和标题保持一致，避免编辑目标任务时误导用户
const dialogDescription = computed(() => {
  if (!props.initialData) return '填写下方信息以创建新任务'
  if (isHabit.value) return '更新您的习惯详情'
  if (isGoalDay.value) return '更新您的目标任务详情'
  return '更新您的任务详情'
})

// 当前选中的任务分类，桥接 eventForm.category 与分类管理 composable
const selectedCategory = computed({
  get: () => eventForm.category,
  set: (value: string) => {
    eventForm.category = value
  }
})

// 任务快捷分类管理：读取本地分类、支持新增删除，并同步当前选中分类
const {
  categories,
  managingCategories,
  newCategoryName,
  addCategory,
  removeCategory
} = useTaskCategories(props.categories, selectedCategory)
</script>

<style scoped>
</style>
