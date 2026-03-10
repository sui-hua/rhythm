<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div 
      v-if="show" 
      class="mobile-drawer-overlay" 
      @click="$emit('update:show', false)"
    ></div>
    
    <!-- 抽屉容器 -->
    <div 
      class="mobile-drawer"
      :class="{ 'mobile-drawer--open': show }"
    >
      <!-- 顶部拉手区域 -->
      <div class="mobile-drawer__handle-bar" @click="$emit('update:show', false)">
        <div class="mobile-drawer__handle"></div>
      </div>

      <div class="mobile-drawer__body">
        <header class="mobile-drawer__header">
          <h2 class="mobile-drawer__title">
            {{ initialData ? (isHabit ? '编辑习惯' : '编辑任务') : '新增任务' }}
          </h2>
          <p class="mobile-drawer__subtitle">
            {{ initialData ? '调整当前项目的详细信息' : '简单几步规划您的新任务' }}
          </p>
        </header>

        <div class="mobile-drawer__scroll-area">
          <div class="mobile-drawer__form">
            <!-- 任务名称 -->
            <div class="mobile-drawer__field">
              <label class="mobile-drawer__label">项目名称</label>
              <input 
                v-model="form.title"
                type="text"
                class="mobile-drawer__input"
                placeholder="例如：早起锻炼 / 部门周会"
              />
            </div>

            <!-- 时间选择 -->
            <div class="mobile-drawer__row">
              <div class="mobile-drawer__field">
                <label class="mobile-drawer__label">开始时间</label>
                <input 
                  v-model="form.time"
                  type="time"
                  class="mobile-drawer__input"
                />
              </div>
              <div class="mobile-drawer__field">
                <label class="mobile-drawer__label">预计时长</label>
                <div class="mobile-drawer__duration-input">
                  <input 
                    v-model="form.duration"
                    type="number"
                    step="0.5"
                    class="mobile-drawer__input"
                  />
                  <span class="mobile-drawer__unit">小时</span>
                </div>
              </div>
            </div>

            <!-- 描述 (非习惯) -->
            <div v-if="!isHabit" class="mobile-drawer__field">
              <label class="mobile-drawer__label">补充描述</label>
              <textarea 
                v-model="form.description"
                class="mobile-drawer__textarea"
                placeholder="可选详情..."
                rows="3"
              ></textarea>
            </div>

            <!-- 分类 (非习惯) -->
            <div v-if="!isHabit" class="mobile-drawer__field">
              <label class="mobile-drawer__label">项目分类</label>
              <div class="mobile-drawer__categories">
                <button 
                  v-for="cat in categories" 
                  :key="cat"
                  @click="form.category = cat"
                  class="mobile-drawer__cat-btn"
                  :class="{ 'mobile-drawer__cat-btn--active': form.category === cat }"
                >
                  {{ cat }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer class="mobile-drawer__footer">
          <button 
            @click="submit"
            :disabled="!form.title || !form.time"
            class="mobile-drawer__btn-primary"
          >
            {{ initialData ? '保存修改' : '确认创建' }}
          </button>
          
          <div class="mobile-drawer__footer-actions">
            <button 
              @click="$emit('update:show', false)"
              class="mobile-drawer__btn-ghost"
            >
              取消
            </button>
            <button 
              v-if="initialData && !isHabit"
              @click="handleDelete"
              class="mobile-drawer__btn-danger"
            >
              删除项目
            </button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
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

const emit = defineEmits(['update:show'])

const { form, isHabit, submit, handleDelete } = useAddEventForm(props, emit)
</script>

<style scoped>
@reference "@/assets/main.css";

/* 遮罩层样式 */
.mobile-drawer-overlay {
  @apply fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px];
  animation: fade-in 0.3s ease-out;
}

/* 抽屉基础样式 */
.mobile-drawer {
  @apply fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)];
  transform: translateY(100%);
  max-height: 92vh;
}

.mobile-drawer--open {
  transform: translateY(0);
}

/* 顶部拉手 */
.mobile-drawer__handle-bar {
  @apply py-4 flex justify-center shrink-0 cursor-pointer;
}
.mobile-drawer__handle {
  @apply w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full;
}

.mobile-drawer__body {
  @apply flex flex-col flex-1 overflow-hidden px-6 pb-8;
}

.mobile-drawer__header {
  @apply text-center mb-6 shrink-0;
}
.mobile-drawer__title {
  @apply text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1;
}
.mobile-drawer__subtitle {
  @apply text-sm text-zinc-500;
}

.mobile-drawer__scroll-area {
  @apply flex-1 overflow-y-auto mb-6;
}

.mobile-drawer__form {
  @apply flex flex-col gap-5;
}

.mobile-drawer__field {
  @apply flex flex-col gap-2;
}
.mobile-drawer__row {
  @apply grid grid-cols-2 gap-4;
}

.mobile-drawer__label {
  @apply text-xs font-bold text-zinc-400 uppercase tracking-widest px-1;
}

/* 输入框通用样式 */
.mobile-drawer__input, 
.mobile-drawer__textarea {
  @apply w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all;
}
.mobile-drawer__textarea {
  @apply resize-none;
}

.mobile-drawer__duration-input {
  @apply relative flex items-center;
}
.mobile-drawer__unit {
  @apply absolute right-4 text-sm text-zinc-400 font-medium pointer-events-none;
}

/* 分类按钮 */
.mobile-drawer__categories {
  @apply flex flex-wrap gap-2;
}
.mobile-drawer__cat-btn {
  @apply px-4 py-2 rounded-xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 text-zinc-500 transition-all;
}
.mobile-drawer__cat-btn--active {
  @apply bg-primary/10 border-primary/20 text-primary shadow-sm;
}

/* 底部按钮 */
.mobile-drawer__footer {
  @apply flex flex-col gap-3 shrink-0;
}
.mobile-drawer__btn-primary {
  @apply w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 active:scale-[0.97] transition-all;
}
.mobile-drawer__btn-primary:disabled {
  @apply opacity-50 grayscale cursor-not-allowed;
}

.mobile-drawer__footer-actions {
  @apply flex gap-2;
}
.mobile-drawer__btn-ghost {
  @apply flex-1 h-12 rounded-xl text-sm font-semibold text-zinc-500 active:bg-zinc-50;
}
.mobile-drawer__btn-danger {
  @apply flex-1 h-12 rounded-xl text-sm font-semibold text-rose-500 active:bg-rose-50;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
