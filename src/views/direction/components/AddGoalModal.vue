<template>
  <Dialog :open="showAddModal" @update:open="showAddModal = $event">
    <DialogContent class="modal-content">
      <DialogHeader>
        <DialogTitle class="modal-title">{{ isEdit ? '编辑目标' : '添加新目标' }}</DialogTitle>
      </DialogHeader>

      <div class="form-grid">
        <div class="form-group">
          <Label for="goal-title" class="form-label">目标名称</Label>
          <Input
            id="goal-title"
            v-model="form.title"
            class="form-input"
            placeholder="目标名称"
            @keyup.enter="submit"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <Label class="form-label">{{ isEdit ? '目标月份' : '开始月份' }}</Label>
            <Select v-model="form.startMonth">
              <SelectTrigger class="form-select-trigger">
                <SelectValue placeholder="选择月份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="m in months" :key="m.value" :value="m.value.toString()">
                  {{ m.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="form-group">
            <Label class="form-label">结束月份</Label>
            <Select v-model="form.endMonth">
              <SelectTrigger class="form-select-trigger">
                <SelectValue placeholder="选择月份" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="m in months"
                  :key="m.value"
                  :value="m.value.toString()"
                  :disabled="m.value < Number(form.startMonth)"
                >
                  {{ m.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="form-group">
          <div class="flex items-center justify-between">
            <Label for="goal-category" class="form-label">目标分类</Label>
            <button
              type="button"
              class="manage-categories-btn"
              @click="showCategoryModal = true"
            >
              <Settings2 class="w-3.5 h-3.5 mr-1" />
              管理类型
            </button>
          </div>
          <Select v-model="form.category_id">
            <SelectTrigger class="form-select-trigger">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未分类</SelectItem>
              <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator class="my-2" />

        <div class="form-row">
          <TimePicker v-model="form.task_time" label="任务时间" id="task-time" />
          <DurationPicker v-model="form.duration" label="预计时长" id="task-duration" />
        </div>
      </div>

      <DialogFooter class="modal-footer">
        <div class="modal-footer-left">
          <button v-if="isEdit" type="button" class="delete-link" @click="handleDeleteGoal">
            删除此目标
          </button>
        </div>
        <div class="modal-footer-actions">
          <Button variant="outline" class="btn-cancel" @click="showAddModal = false">取消</Button>
          <Button class="btn-submit" @click="submit">{{ isEdit ? '确认修改' : '确认创建' }}</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 类别管理弹窗 -->
  <CategoryManagementModal @updated="fetchCategories" />
</template>

<script setup lang="ts">
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import CategoryManagementModal from './CategoryManagementModal.vue'
import { Settings2 } from 'lucide-vue-next'
import { db } from '@/services/database'

import { months } from '@/views/direction/composables/useDirectionState'
import { withLoadingLock } from '@/utils/throttle'

const { showAddModal, showCategoryModal, editingGoal, handleAddGoal, handleUpdateGoal, handleDeleteGoal } = useDirectionGoals()

import { categories } from '@/views/direction/composables/useDirectionState'

const fetchCategories = async () => {
  if (categories.value?.length > 0) return  // 已有数据则跳过，避免重复请求
  try {
    categories.value = await db.plansCategory.list()
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
}

onMounted(fetchCategories)

watch(() => showCategoryModal.value, (newVal) => {
  if (!newVal) {
    fetchCategories()
  }
})

const form = reactive({
  title: '',
  startMonth: (new Date().getMonth() + 1).toString(),
  endMonth: (new Date().getMonth() + 1).toString(),
  category_id: 'none',
  task_time: '09:00',
  duration: 0.5
})

watch(() => showAddModal.value, (newVal) => {
  if (newVal) {
    if (editingGoal.value) {
      form.title = editingGoal.value.name || editingGoal.value.title
      form.startMonth = (editingGoal.value.startMonth || new Date().getMonth() + 1).toString()
      form.endMonth = (editingGoal.value.endMonth || editingGoal.value.startMonth || new Date().getMonth() + 1).toString()
      form.category_id = editingGoal.value.category_id || 'none'
      form.task_time = editingGoal.value.task_time || '09:00'
      form.duration = editingGoal.value.duration ? editingGoal.value.duration / 60 : 0.5
    } else {
      form.title = ''
      form.category_id = 'none'
      form.startMonth = (new Date().getMonth() + 1).toString()
      form.endMonth = (new Date().getMonth() + 1).toString()
      form.task_time = '09:00'
      form.duration = 0.5
    }
  }
})

watch(() => form.startMonth, (newVal) => {
  if (form.endMonth < newVal) {
    form.endMonth = newVal
  }
})

const isEdit = computed(() => !!editingGoal.value)

const submit = withLoadingLock(async () => {
  if (!form.title.trim()) return

  const payload = {
    title: form.title,
    startMonth: parseInt(form.startMonth),
    endMonth: parseInt(form.endMonth),
    category_id: form.category_id === 'none' ? null : form.category_id,
    task_time: form.task_time,
    duration: Math.round(form.duration * 60),
    status: 'active',
  }

  if (isEdit.value) {
    await handleUpdateGoal(payload)
  } else {
    await handleAddGoal(payload)
  }
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

.modal-content {
  @apply sm:max-w-[450px] p-6 rounded-xl border shadow-lg bg-background;
}

.modal-title {
  @apply text-xl font-bold tracking-tight;
}

.form-grid {
  @apply grid gap-6 py-4;
}

.form-row {
  @apply grid grid-cols-2 gap-4;
}

.form-group {
  @apply grid gap-2;
}

.form-label {
  @apply text-xs font-bold uppercase tracking-widest text-muted-foreground;
}

.form-input {
  @apply h-10 border shadow-none focus-visible:ring-1;
}

.form-select-trigger {
  @apply h-10 border shadow-none focus:ring-1;
}

.modal-footer {
  @apply pt-2 flex justify-between items-center w-full;
}

.modal-footer-left {
  @apply flex-1;
}

.modal-footer-actions {
  @apply flex gap-2;
}

.delete-link {
  @apply text-xs text-destructive hover:underline underline-offset-4;
}

.manage-categories-btn {
  @apply flex items-center text-[10px] font-bold text-primary/70 hover:text-primary transition-colors uppercase tracking-wider mb-1;
}

.btn-cancel {
  @apply h-10 rounded-lg;
}

.btn-submit {
  @apply h-10 rounded-lg font-bold px-8 shadow-md hover:scale-[1.02] active:scale-95 transition-all;
}
</style>
