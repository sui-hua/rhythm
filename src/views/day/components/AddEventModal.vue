<template>
  <Dialog :open="show" @update:open="$emit('update:show', $event)">
    <DialogContent class="modal">
      <div class="modal__body">
        <div class="modal__header">
          <h1 class="modal__title">
            {{ initialData ? (isHabit ? '编辑习惯' : '编辑任务') : '新增任务' }}
          </h1>
          <p class="modal__subtitle">
            {{ initialData ? (isHabit ? '更新您的习惯详情' : '更新您的任务详情') : '填写下方信息以创建新任务' }}
          </p>
        </div>

        <div class="modal__form">
          <!-- Title Group -->
          <div class="modal__field">
            <label for="title" class="modal__label">任务名称</label>
            <Input 
              id="title"
              v-model="form.title"
              placeholder="例如：周会 / 健身"
              class="h-9"
            />
          </div>

          <!-- Time & Duration Group -->
          <div class="modal__field-row">
            <TimePicker 
              v-model="form.time" 
              label="任务时间"
              id="time"
            />
            <DurationPicker 
              v-model="form.duration" 
              label="任务时长"
              id="duration"
              @submit="submit"
            />
          </div>

          <!-- Description Group (仅任务类型显示) -->
          <div v-if="!isHabit" class="modal__field">
            <label for="description" class="modal__label">任务描述</label>
            <Input 
              id="description"
              v-model="form.description"
              placeholder="可选详情..."
              class="h-9"
            />
          </div>

          <!-- Category Group (仅任务类型显示) -->
          <div v-if="!isHabit" class="modal__field">
            <label class="modal__label">分类</label>
            <div class="modal__categories">
              <Button 
                v-for="cat in categories" 
                :key="cat"
                type="button"
                variant="outline"
                size="sm"
                @click="form.category = cat"
                class="modal__category-btn"
                :class="[
                  form.category === cat 
                    ? 'modal__category-btn--active' 
                    : 'modal__category-btn--inactive'
                ]"
              >
                {{ cat }}
              </Button>
            </div>
          </div>

          <div class="modal__actions">
            <Button 
              class="modal__submit-btn"
              @click="submit"
              :disabled="!form.title || !form.time"
            >
              {{ initialData ? '保存修改' : '确认创建' }}
            </Button>
            <Button 
              variant="outline"
              class="modal__cancel-btn"
              @click="$emit('update:show', false)"
            >
              取消
            </Button>
            <button 
              v-if="initialData && !isHabit"
              type="button"
              @click="handleDelete"
              class="modal__delete-btn"
            >
              删除此任务
            </button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { useAddEventForm } from '../composables/useAddEventForm'

const props = defineProps({
  show: Boolean,
  initialData: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => ['工作', '个人', '会议', '设计', '其他']
  }
})

const emit = defineEmits(['close', 'refresh', 'update:show'])

const { form, isHabit, submit, handleDelete } = useAddEventForm(props, emit)
</script>

<style scoped>
@reference "@/assets/main.css";
.modal {
  @apply sm:max-w-[400px] p-6 rounded-xl border shadow-lg bg-background;
}
.modal__body {
  @apply flex flex-col gap-6;
}
.modal__header {
  @apply flex flex-col gap-2 text-center;
}
.modal__title {
  @apply text-2xl font-semibold tracking-tight;
}
.modal__subtitle {
  @apply text-sm text-muted-foreground;
}
.modal__form {
  @apply grid gap-6;
}
.modal__field {
  @apply grid gap-2;
}
.modal__field-row {
  @apply grid grid-cols-2 gap-4;
}
.modal__label {
  @apply text-sm font-medium leading-none;
}
.modal__categories {
  @apply flex gap-2 flex-wrap;
}
.modal__category-btn {
  @apply rounded-md text-[10px] font-bold h-7 px-3 transition-all;
}
.modal__category-btn--active {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
}
.modal__category-btn--inactive {
  @apply text-muted-foreground;
}
.modal__actions {
  @apply flex flex-col gap-3 pt-2;
}
.modal__submit-btn {
  @apply w-full h-9 bg-primary text-primary-foreground font-semibold;
}
.modal__cancel-btn {
  @apply w-full h-9;
}
.modal__delete-btn {
  @apply text-xs text-destructive hover:underline underline-offset-4 mt-2;
}
</style>