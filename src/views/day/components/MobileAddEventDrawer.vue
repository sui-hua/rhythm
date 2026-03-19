<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div 
      v-if="show" 
      class="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]"
      @click="$emit('update:show', false)"
    ></div>
    
    <!-- 抽屉容器 -->
    <div 
      class="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-2xl flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
      :class="show ? 'translate-y-0' : 'translate-y-full'"
      style="max-height: 92vh;"
    >
      <!-- 顶部拉手区域 -->
      <div class="py-4 flex justify-center shrink-0 cursor-pointer" @click="$emit('update:show', false)">
        <div class="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
      </div>

      <div class="flex flex-col flex-1 overflow-hidden px-6 pb-8">
        <header class="text-center mb-6 shrink-0">
          <h2 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            {{ initialData ? (isHabit ? '编辑习惯' : '编辑任务') : '新增任务' }}
          </h2>
          <p class="text-sm text-zinc-500">
            {{ initialData ? '调整当前项目的详细信息' : '简单几步规划您的新任务' }}
          </p>
        </header>

        <div class="flex-1 overflow-y-auto mb-6">
          <div class="flex flex-col gap-5">
            <!-- 任务名称 -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">项目名称</label>
              <input 
                v-model="form.title"
                type="text"
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="例如：早起锻炼 / 部门周会"
              />
            </div>

            <!-- 时间选择 -->
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">开始时间</label>
                <input 
                  v-model="form.time"
                  type="time"
                  class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">预计时长</label>
                <div class="relative flex items-center">
                  <input 
                    v-model="form.duration"
                    type="number"
                    step="0.5"
                    class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-3 text-base text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <span class="absolute right-4 text-sm text-zinc-400 font-medium pointer-events-none">小时</span>
                </div>
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
                  class="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 text-zinc-500 transition-all"
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
            :disabled="!form.title || !form.time"
            class="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 active:scale-[0.97] transition-all"
          >
            {{ initialData ? '保存修改' : '确认创建' }}
          </button>
          
          <div class="flex gap-2">
            <button 
              @click="$emit('update:show', false)"
              class="flex-1 h-12 rounded-xl text-sm font-semibold text-zinc-500 active:bg-zinc-50"
            >
              取消
            </button>
            <button 
              v-if="initialData && !isHabit"
              @click="handleDelete"
              class="flex-1 h-12 rounded-xl text-sm font-semibold text-rose-500 active:bg-rose-50"
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
import { useAddEventForm } from '@/views/day/composables/useAddEventForm'

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
@reference "@/assets/tw-theme.css";
</style>
