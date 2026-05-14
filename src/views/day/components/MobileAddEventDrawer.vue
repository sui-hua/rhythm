<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div 
      v-if="show" 
      class="fixed inset-0 z-[240] bg-black/40 backdrop-blur-[2px]"
      @click="$emit('update:show', false)"
    ></div>
    
    <!-- 抽屉容器 -->
    <div 
      class="fixed bottom-0 left-0 right-0 z-[250] bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe relative"
      :class="show ? 'translate-y-0' : 'translate-y-full'"
      style="max-height: 92vh;"
    >
      <!-- 顶部拉手区域 -->
      <div class="py-4 flex justify-center shrink-0 cursor-pointer" @click="$emit('update:show', false)">
        <div class="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
      </div>

      <div class="flex flex-col flex-1 overflow-hidden px-7 pb-10">
        <!-- Loading overlay -->
        <div
          v-if="isSubmitting"
          class="absolute inset-0 z-10 bg-white/60 dark:bg-zinc-900/60 flex items-center justify-center rounded-t-[2.5rem]"
        >
          <div class="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>

        <header class="text-left mb-8 shrink-0">
          <h2 class="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 mb-1">
            {{ initialData ? (isHabit ? 'Edit Habit' : 'Edit Task') : 'New Task' }}
          </h2>
          <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            {{ initialData ? 'Modify your plan' : 'Plan your next move' }}
          </p>
        </header>

        <div class="flex-1 overflow-y-auto mb-6">
          <div class="flex flex-col gap-5">
            <!-- 任务名称 -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                项目名称<span class="text-rose-500">*</span>
              </label>
              <input
                v-model="form.title"
                type="text"
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="例如：早起锻炼 / 部门周会"
                @blur="touchField('title')"
              />
              <p v-if="errors.title" class="text-xs text-rose-500 mt-1 px-1">{{ errors.title }}</p>
            </div>

            <!-- 时间选择 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                  开始时间<span class="text-rose-500">*</span>
                </label>
                <TimePicker
                  v-model="form.time"
                  placeholder="08:00"
                  @submit="submit"
                />
                <p v-if="errors.time" class="text-xs text-rose-500 mt-1 px-1">{{ errors.time }}</p>
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">预计时长</label>
                <DurationPicker v-model="form.duration" @submit="submit" />
                <p v-if="errors.duration" class="text-xs text-rose-500 mt-1 px-1">{{ errors.duration }}</p>
              </div>
            </div>

            <!-- 描述 (非习惯) -->
            <div v-if="!isHabit" class="flex flex-col gap-2">
              <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">补充描述</label>
              <textarea 
                v-model="form.description"
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                placeholder="可选详情..."
                rows="3"
              ></textarea>
            </div>

            <!-- 分类 (非习惯) -->
            <div v-if="!isHabit" class="flex flex-col gap-2">
              <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">项目分类</label>
              <div class="flex flex-wrap gap-2">
                <button 
                  v-for="cat in categories" 
                  :key="cat"
                  @click="form.category = cat"
                  class="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 text-zinc-500 transition-all active:scale-[0.97]"
                  :class="form.category === cat ? 'bg-primary/10 border-primary/20 text-primary shadow-sm' : ''"
                >
                  {{ cat }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer class="flex flex-col gap-3 shrink-0">
          <button
            @click="submit"
            :disabled="!isValid"
            class="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 transition-all disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {{ initialData ? '保存修改' : '确认创建' }}
          </button>
          
          <div class="flex gap-2">
            <button 
              @click="$emit('update:show', false)"
              class="flex-1 h-12 rounded-xl text-sm font-semibold text-zinc-500 active:bg-zinc-50 active:scale-[0.97]"
            >
              取消
            </button>
            <button
              v-if="initialData && !isHabit"
              @click="handleDelete"
              aria-label="删除项目"
              class="flex-1 h-12 rounded-xl text-sm font-semibold text-rose-500 active:bg-rose-50 active:scale-[0.97]"
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
/**
 * MobileAddEventDrawer.vue - 移动端添加/编辑事件抽屉组件
 * 
 * 功能说明：
 * - 提供移动端友好的滑出式抽屉界面，用于快速创建或编辑任务/习惯
 * - 支持从屏幕底部滑入/滑出动画（transition-transform）
 * - 使用 Teleport 渲染到 body 解决层叠上下文问题
 * 
 * Props：
 * - show: Boolean - 控制抽屉显示/隐藏
 * - initialData: Object - 初始数据（传入时为编辑模式，否则为新建模式）
 * - categories: Array - 项目分类标签列表，默认 ['工作', '个人', '会议', '设计', '其他']
 * 
 * Emits：
 * - update:show - 双向绑定控制抽屉显隐
 * 
 * 表单字段：
 * - title: 任务名称（必填）
 * - time: 开始时间（必填）
 * - duration: 预计时长
 * - description: 补充描述（非习惯专用）
 * - category: 项目分类（非习惯专用）
 * 
 * 与 useAddEventForm composable 配合使用：
 * - 负责表单状态管理、验证、提交逻辑
 * - 根据 initialData 判断是新建还是编辑模式
 * - 支持习惯(Task) 和普通任务(Habit) 两种模式
 */
import { useAddEventForm } from '@/views/day/composables/useAddEventForm'
import { formatDuration } from '@/utils/formatDuration'
import TimePicker from '@/components/ui/TimePicker.vue'
import DurationPicker from '@/components/ui/DurationPicker.vue'

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

const { form, isHabit, errors, isValid, submit, handleDelete, isSubmitting, touchField } = useAddEventForm(props, emit)
</script>

<style scoped>
</style>
