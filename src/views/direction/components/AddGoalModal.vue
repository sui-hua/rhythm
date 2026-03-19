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
            <select v-model="form.startMonth" class="form-select">
              <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <Label class="form-label">结束月份</Label>
            <select v-model="form.endMonth" class="form-select">
              <option v-for="m in months" :key="m.value" :value="m.value" :disabled="m.value < form.startMonth">
                {{ m.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <Label for="goal-category" class="form-label">目标分类</Label>
          <select id="goal-category" v-model="form.category_id" class="form-select">
            <option value="">未分类</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="form-row">
          <TimePicker v-model="form.task_time" label="任务时间" id="task-time" />
          <DurationPicker v-model="form.duration" label="预计时长 (分钟)" id="task-duration" />
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
</template>

<script setup lang="ts">
import { useDirectionGoals } from '@/views/direction/composables/useDirectionGoals'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'
import { db } from '@/services/database'

const { showAddModal, editingGoal, handleAddGoal, handleUpdateGoal, handleDeleteGoal } = useDirectionGoals()

const categories = ref([])

onMounted(async () => {
  try {
    categories.value = await db.plansCategory.list()
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
})

const form = reactive({
  title: '',
  startMonth: new Date().getMonth() + 1,
  endMonth: new Date().getMonth() + 1,
  category_id: '',
  task_time: '09:00',
  duration: 30
})

watch(() => showAddModal.value, (newVal) => {
  if (newVal) {
    if (editingGoal.value) {
      form.title = editingGoal.value.name || editingGoal.value.title
      form.startMonth = editingGoal.value.startMonth || new Date().getMonth() + 1
      form.endMonth = editingGoal.value.endMonth || editingGoal.value.startMonth || new Date().getMonth() + 1
      form.category_id = editingGoal.value.category_id || ''
      form.task_time = editingGoal.value.task_time || '09:00'
      form.duration = editingGoal.value.duration || 30
    } else {
      form.title = ''
      form.category_id = ''
      form.startMonth = new Date().getMonth() + 1
      form.endMonth = new Date().getMonth() + 1
      form.task_time = '09:00'
      form.duration = 30
    }
  }
})

watch(() => form.startMonth, (newVal) => {
  if (form.endMonth < newVal) {
    form.endMonth = newVal
  }
})

const isEdit = computed(() => !!editingGoal.value)

const months = [
  { label: '1月', value: 1 }, { label: '2月', value: 2 },
  { label: '3月', value: 3 }, { label: '4月', value: 4 },
  { label: '5月', value: 5 }, { label: '6月', value: 6 },
  { label: '7月', value: 7 }, { label: '8月', value: 8 },
  { label: '9月', value: 9 }, { label: '10月', value: 10 },
  { label: '11月', value: 11 }, { label: '12月', value: 12 }
]

const submit = async () => {
  if (!form.title.trim()) return

  const payload = {
    title: form.title,
    startMonth: form.startMonth,
    endMonth: form.endMonth,
    category_id: form.category_id || null,
    task_time: form.task_time,
    duration: form.duration,
    status: 'active',
  }

  if (isEdit.value) {
    await handleUpdateGoal(payload)
  } else {
    await handleAddGoal(payload)
  }
}
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

.form-select {
  @apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring;
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

.btn-cancel {
  @apply h-10 rounded-lg;
}

.btn-submit {
  @apply h-10 rounded-lg font-bold px-8 shadow-md hover:scale-[1.02] active:scale-95 transition-all;
}
</style>
