<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div 
      v-if="show" 
      class="fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px]"
      @click="$emit('update:show', false)"
    ></div>
    
    <!-- 抽屉容器 -->
    <div 
      class="fixed bottom-0 left-0 right-0 z-101 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
      :class="show ? 'translate-y-0' : 'translate-y-full'"
      style="max-height: 92vh;"
    >
      <!-- 顶部拉手区域 -->
      <div class="py-4 flex justify-center shrink-0 cursor-pointer" @click="$emit('update:show', false)">
        <div class="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
      </div>

      <div class="flex flex-col flex-1 overflow-hidden px-7 pb-10">
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
// 移动端新增/编辑任务抽屉：底部弹窗，支持完整表单填写
// 与 AddEventModal 功能一致，针对移动端交互优化
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

const { form, isHabit, errors, isValid, submit, handleDelete } = useAddEventForm(props, emit)
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
