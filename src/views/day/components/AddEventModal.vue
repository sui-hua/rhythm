<template>
  <!-- Dialog：弹窗容器，open 属性控制显示，update:open 同步关闭状态 -->
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <!-- DialogContent：弹窗内容区，sm:max-w-[400px] 限制最大宽度为 400px -->
    <DialogContent class="sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background">
      <!-- DialogTitle/DialogDescription：仅供屏幕阅读器访问的语义标题（sr-only） -->
      <DialogTitle class="sr-only">{{ initialData ? (isHabit ? '编辑习惯' : '编辑任务') : '新增任务' }}</DialogTitle>
      <DialogDescription class="sr-only">{{ initialData ? (isHabit ? '更新您的习惯详情' : '更新您的任务详情') : '填写下方信息以创建新任务' }}</DialogDescription>
      
      <!-- 弹窗主体：垂直排列的表单区域，gap-6 控制各区块间距 -->
      <div class="flex flex-col gap-6">
        <!-- 标题区块：居中显示，根据编辑/新增、任务/习惯切换文案 -->
        <div class="flex flex-col gap-2 text-center">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ initialData ? (isHabit ? '编辑习惯' : '编辑任务') : '新增任务' }}
          </h1>
          <p class="text-sm text-muted-foreground">
            {{ initialData ? (isHabit ? '更新您的习惯详情' : '更新您的任务详情') : '填写下方信息以创建新任务' }}
          </p>
        </div>

        <!-- 表单网格区域 -->
        <div class="grid gap-6">
          <!-- Title Group：任务名称输入，必填项 -->
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
            <!-- 错误提示：当 title 验证失败时显示 -->
            <p v-if="errors.title" class="text-xs text-rose-500">{{ errors.title }}</p>
          </div>

          <!-- Time & Duration Group：时间和时长成对显示，左右两列布局 -->
          <div class="grid grid-cols-2 gap-4">
            <!-- TimePicker：时间选择器 -->
            <TimePicker
              v-model="eventForm.time"
              label="任务时间"
              id="time"
            />
            <!-- DurationPicker：时长选择器，支持直接提交 -->
            <DurationPicker
              v-model="eventForm.duration"
              label="任务时长"
              id="duration"
              @submit="submit"
            />
          </div>

          <!-- Description Group (仅任务类型显示)：习惯无描述字段 -->
          <div v-if="!isHabit" class="grid gap-2">
            <label for="description" class="text-sm font-medium leading-none">任务描述</label>
            <Input 
              id="description"
              v-model="eventForm.description"
              placeholder="可选详情..."
              class="h-9"
            />
          </div>

          <!-- Category Group (仅任务类型显示)：习惯无分类字段 -->
          <div v-if="!isHabit" class="grid gap-2">
            <label class="text-sm font-medium leading-none">分类</label>
            <!-- 分类标签按钮组，支持单选切换 -->
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

          <!-- 操作按钮区 -->
          <div class="flex flex-col gap-3 pt-2">
            <!-- 主要操作按钮：提交表单，表单无效时禁用 -->
            <Button 
              class="w-full h-9 bg-primary text-primary-foreground font-semibold"
              @click="submit"
              :disabled="!isValid"
            >
              {{ initialData ? '保存修改' : '确认创建' }}
            </Button>
            <!-- 取消按钮：关闭弹窗 -->
            <Button 
              variant="outline"
              class="w-full h-9"
              @click="$emit('update:show', false)"
            >
              取消
            </Button>
            <!-- 删除按钮：仅编辑模式下显示（initialData 存在）且仅任务类型（习惯不可删除） -->
            <button 
              v-if="initialData && !isHabit"
              type="button"
              @click="handleDelete"
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
<script lang="ts" setup>
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { useAddEventForm, type InitialEventData } from '@/views/day/composables/useAddEventForm'

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

const emit = defineEmits(['close', 'refresh', 'update:show'])

const { eventForm, isHabit, errors, isValid, submit, handleDelete, markFieldTouched } = useAddEventForm(props, emit)
</script>

<style scoped>
</style>
