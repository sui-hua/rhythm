<template>
  <!-- ================================================================
    AddGoalModal —— 添加/编辑目标弹窗

    功能：
    - 「添加模式」：创建一条新的长期目标（plans 表）
    - 「编辑模式」：修改已有目标的名称、月份区间、分类、任务时间与时长
    - 支持在弹窗内快捷跳转到「类别管理」弹窗（CategoryManagementModal）

    交互流程：
    1. 父级通过 showAddModal（ref）控制弹窗开/关
    2. 编辑时父级同时写入 editingGoal（ref），组件监听后自动回填表单
    3. 点击「确认创建/修改」→ submit() → handleAddGoal / handleUpdateGoal
    4. 编辑模式下底部显示「删除此目标」快捷入口

    依赖：
    - useDirectionGoals   管理弹窗状态、编辑目标及增删改操作
    - useDirectionState   提供 months 月份列表 与 categories 分类列表
    - withLoadingLock     防止表单重复提交
    - CategoryManagementModal  类别管理子弹窗
  ================================================================ -->
  <Dialog :open="showAddModal" @update:open="showAddModal = $event">
    <DialogContent class="modal-content">
      <DialogHeader>
        <!-- 标题：根据 isEdit 动态切换「编辑目标」或「添加新目标」 -->
        <DialogTitle class="modal-title">{{ isEdit ? '编辑目标' : '添加新目标' }}</DialogTitle>
      </DialogHeader>

      <div class="form-grid">
        <!-- ── 目标名称输入框 ── -->
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

        <!-- ── 月份区间：开始月份 & 结束月份 ── -->
        <div class="form-row">
          <!-- 开始月份（编辑模式下标签改为「目标月份」） -->
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

          <!-- 结束月份：早于开始月份的选项自动 disabled -->
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

        <!-- ── 目标分类 ── -->
        <div class="form-group">
          <div class="flex items-center justify-between">
            <Label for="goal-category" class="form-label">目标分类</Label>
            <!-- 管理类型按钮：打开 CategoryManagementModal -->
            <button
              type="button"
              class="manage-categories-btn"
              @click="showCategoryModal = true"
            >
              <Settings2 class="w-3.5 h-3.5 mr-1" />
              管理类型
            </button>
          </div>
          <!-- 分类下拉列表：第一项固定为「未分类」，其余来自 categories -->
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

        <!-- ── 分隔线 ── -->
        <Separator class="my-2" />

        <!-- ── 任务时间 & 预计时长 ── -->
        <div class="form-row">
          <!-- 任务时间选择器（HH:mm 格式） -->
          <TimePicker v-model="form.task_time" label="任务时间" id="task-time" />
          <!-- 预计时长选择器（单位：小时，存储时转换为分钟） -->
          <DurationPicker v-model="form.duration" label="预计时长" id="task-duration" />
        </div>
      </div>

      <!-- ── 底部操作区 ── -->
      <DialogFooter class="modal-footer">
        <!-- 左侧：编辑模式下显示「删除此目标」快捷入口 -->
        <div class="modal-footer-left">
          <button v-if="isEdit" type="button" class="delete-link" @click="handleDeleteGoal">
            删除此目标
          </button>
        </div>
        <!-- 右侧：取消 & 确认按钮 -->
        <div class="modal-footer-actions">
          <Button variant="outline" class="btn-cancel" @click="showAddModal = false">取消</Button>
          <Button class="btn-submit" @click="submit">{{ isEdit ? '确认修改' : '确认创建' }}</Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 类别管理弹窗：关闭后回调 fetchCategories 刷新分类列表 -->
  <CategoryManagementModal @updated="fetchCategories" />
</template>

<!--
  @file AddGoalModal.vue
  @description 添加/编辑目标的弹窗组件（Direction 模块）

  ## 核心职责
  - 统一处理「新建目标」和「编辑目标」两种场景，通过 `isEdit` 计算属性区分
  - 表单字段：目标名称、开始/结束月份、分类、每日任务时间、预计时长
  - 提交前校验：标题不能为空；使用 withLoadingLock 防止重复提交

  ## 状态来源
  - `showAddModal` / `showCategoryModal` / `editingGoal`
    来自 useDirectionGoals，控制弹窗显示与当前编辑的目标数据
  - `categories` 来自 useDirectionState，从 db.plansCategory 懒加载
  - `months` 来自 useDirectionState，1~12 月份静态列表

  ## 表单联动规则
  - watch(showAddModal)：弹窗打开时，若处于编辑模式则回填字段，否则重置为默认值
  - watch(form.startMonth)：开始月份变更时，若结束月份早于开始月份则自动同步
  - 结束月份下拉列表中早于 startMonth 的选项自动 disabled

  ## 提交逻辑（submit）
  1. 标题为空则直接返回，不发请求
  2. 将 duration（小时）× 60 转换为分钟存储
  3. category_id 为 'none' 时转为 null
  4. 编辑模式 → handleUpdateGoal；新建模式 → handleAddGoal

  ## 分类懒加载策略
  - onMounted 时调用 fetchCategories
  - 若 categories 已有数据则跳过，避免重复请求
  - CategoryManagementModal 关闭后（watch showCategoryModal → false）重新拉取，
    以同步用户在分类管理中新增/删除的变更
-->
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

// ──────────────────────────────────────────────
// Composable 解构：弹窗状态 & 目标 CRUD 操作
// ──────────────────────────────────────────────
const { showAddModal, showCategoryModal, editingGoal, handleAddGoal, handleUpdateGoal, handleDeleteGoal } = useDirectionGoals()

// 分类列表（响应式），从 useDirectionState 获取共享状态
const { categories } = useDirectionState()

// ──────────────────────────────────────────────
// 分类数据懒加载
// ──────────────────────────────────────────────
const fetchCategories = async () => {
  if (categories.value?.length > 0) return  // 已有数据则跳过，避免重复请求
  try {
    categories.value = await db.plansCategory.list()
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
}

// 组件挂载时初始化分类列表
onMounted(fetchCategories)

// 类别管理弹窗关闭后，重新拉取分类以同步最新变更
watch(() => showCategoryModal.value, (newVal) => {
  if (!newVal) {
    fetchCategories()
  }
})

// ──────────────────────────────────────────────
// 表单状态（reactive）
// 默认值：当月、未分类、09:00 开始、0.5 小时
// ──────────────────────────────────────────────
const form = reactive({
  title: '',
  startMonth: (new Date().getMonth() + 1).toString(),
  endMonth: (new Date().getMonth() + 1).toString(),
  category_id: 'none',
  task_time: '09:00',
  duration: 0.5
})

// ──────────────────────────────────────────────
// 监听弹窗开关，回填或重置表单
// ──────────────────────────────────────────────
watch(() => showAddModal.value, (newVal) => {
  if (newVal) {
    if (editingGoal.value) {
      // 编辑模式：将已有目标数据回填到表单
      form.title = editingGoal.value.name || editingGoal.value.title
      form.startMonth = (editingGoal.value.startMonth || new Date().getMonth() + 1).toString()
      form.endMonth = (editingGoal.value.endMonth || editingGoal.value.startMonth || new Date().getMonth() + 1).toString()
      form.category_id = editingGoal.value.category_id || 'none'
      form.task_time = editingGoal.value.task_time || '09:00'
      // duration 数据库存储为分钟，表单使用小时；缺省 0.5h
      form.duration = editingGoal.value.duration ? editingGoal.value.duration / 60 : 0.5
    } else {
      // 新建模式：重置所有字段为默认值
      form.title = ''
      form.category_id = 'none'
      form.startMonth = (new Date().getMonth() + 1).toString()
      form.endMonth = (new Date().getMonth() + 1).toString()
      form.task_time = '09:00'
      form.duration = 0.5
    }
  }
})

// ──────────────────────────────────────────────
// 开始月份变更联动：自动修正结束月份不早于开始月份
// ──────────────────────────────────────────────
watch(() => form.startMonth, (newVal) => {
  if (form.endMonth < newVal) {
    form.endMonth = newVal
  }
})

// ──────────────────────────────────────────────
// isEdit：判断当前是编辑模式还是新建模式
// ──────────────────────────────────────────────
const isEdit = computed(() => !!editingGoal.value)

// ──────────────────────────────────────────────
// submit：表单提交（带加载锁，防止重复点击）
// ──────────────────────────────────────────────
const submit = withLoadingLock(async () => {
  // 校验：标题不能为空
  if (!form.title.trim()) return

  // 构造提交 payload
  const payload = {
    title: form.title,
    startMonth: parseInt(form.startMonth),
    endMonth: parseInt(form.endMonth),
    // 未分类时存 null
    category_id: form.category_id === 'none' ? null : form.category_id,
    task_time: form.task_time,
    // duration 小时 → 分钟（取整）
    duration: Math.round(form.duration * 60),
    status: 'active',
  }

  if (isEdit.value) {
    // 编辑模式：更新已有目标
    await handleUpdateGoal(payload)
  } else {
    // 新建模式：创建新目标
    await handleAddGoal(payload)
  }
})
</script>

<style scoped>
@reference "@/assets/tw-theme.css";

/* 弹窗容器：最大宽度 450px，圆角卡片样式 */
.modal-content {
  @apply sm:max-w-[450px] p-6 rounded-xl border shadow-lg bg-background;
}

/* 弹窗标题 */
.modal-title {
  @apply text-xl font-bold tracking-tight;
}

/* 表单整体网格布局，各区块间距 24px */
.form-grid {
  @apply grid gap-6 py-4;
}

/* 两列表单行（开始/结束月份、时间/时长） */
.form-row {
  @apply grid grid-cols-2 gap-4;
}

/* 单个表单字段容器 */
.form-group {
  @apply grid gap-2;
}

/* 表单字段标签：小写转大写、加宽字间距，视觉层级弱化 */
.form-label {
  @apply text-xs font-bold uppercase tracking-widest text-muted-foreground;
}

/* 文本输入框 */
.form-input {
  @apply h-10 border shadow-none focus-visible:ring-1;
}

/* 下拉选择器触发按钮 */
.form-select-trigger {
  @apply h-10 border shadow-none focus:ring-1;
}

/* 底部操作栏：左右两端对齐 */
.modal-footer {
  @apply pt-2 flex justify-between items-center w-full;
}

/* 底部左侧区域（删除按钮占位） */
.modal-footer-left {
  @apply flex-1;
}

/* 底部右侧按钮组 */
.modal-footer-actions {
  @apply flex gap-2;
}

/* 删除链接：红色文字，hover 下划线 */
.delete-link {
  @apply text-xs text-destructive hover:underline underline-offset-4;
}

/* 管理类型按钮：极小字号，主色调，hover 加深 */
.manage-categories-btn {
  @apply flex items-center text-[10px] font-bold text-primary/70 hover:text-primary transition-colors uppercase tracking-wider mb-1;
}

/* 取消按钮 */
.btn-cancel {
  @apply h-10 rounded-lg;
}

/* 确认按钮：加粗、阴影、hover 微放大、active 微缩小 */
.btn-submit {
  @apply h-10 rounded-lg font-bold px-8 shadow-md hover:scale-[1.02] active:scale-95 transition-all;
}
</style>
