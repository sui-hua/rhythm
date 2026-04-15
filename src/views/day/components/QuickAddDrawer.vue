<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div
      v-if="show"
      class="fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px]"
      @click="handleClose"
    ></div>

    <!-- 抽屉容器 -->
    <div
      class="fixed bottom-0 left-0 right-0 z-101 bg-white dark:bg-zinc-900 rounded-t-[2.5rem] shadow-(--shadow-modal) flex flex-col transition-transform duration-700 ease-expo pb-safe"
      :class="show ? 'translate-y-0' : 'translate-y-full'"
      style="max-height: 50vh;"
    >
      <!-- 顶部拉手区域 -->
      <div class="py-4 flex justify-center shrink-0 cursor-pointer" @click="handleClose">
        <div class="w-12 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full"></div>
      </div>

      <div class="flex flex-col flex-1 overflow-hidden px-7 pb-10">
        <header class="text-left mb-6 shrink-0">
          <h2 class="text-3xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 mb-1">
            Quick Add
          </h2>
          <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            快速添加任务
          </p>
        </header>

        <div class="flex-1 overflow-y-auto mb-6">
          <div class="flex flex-col gap-5">
            <!-- 任务名称 - 唯一必填项 -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">项目名称</label>
              <input
                ref="titleInput"
                v-model="form.title"
                type="text"
                class="w-full bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl px-4 py-4 text-lg text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="输入任务名称，回车快速创建"
                @keydown.enter="handleQuickSubmit"
              />
            </div>

            <!-- 默认值预览 -->
            <div class="flex items-center gap-4 text-sm text-zinc-400">
              <span class="flex items-center gap-1">
                <Clock class="w-4 h-4" />
                {{ form.time }}
              </span>
              <span>·</span>
              <span>{{ form.duration }}小时</span>
              <span>·</span>
              <span>{{ form.category }}</span>
            </div>

            <!-- 更多选项按钮 -->
            <button
              @click="$emit('switch-to-full')"
              class="text-xs text-primary hover:underline underline-offset-4 text-left"
            >
              + 更多选项（完整模式）
            </button>
          </div>
        </div>

        <footer class="shrink-0">
          <button
            @click="handleQuickSubmit"
            :disabled="!form.title"
            class="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold text-lg shadow-xl shadow-zinc-900/10 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            快速创建
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// 移动端快速添加抽屉：底部弹窗，仅需标题即可快速创建任务
// 回车或点击按钮提交，使用默认时间和时长
import { ref, watch, nextTick } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useQuickAddForm } from '@/views/day/composables/useQuickAddForm'

const props = defineProps({
  show: Boolean,
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:show', 'switch-to-full'])

const { form, quickSubmit } = useQuickAddForm(props, emit)
const titleInput = ref(null)

// 自动聚焦标题输入框
watch(() => props.show, async (newShow) => {
  if (newShow) {
    await nextTick()
    titleInput.value?.focus()
  }
})

const handleQuickSubmit = async () => {
  const success = await quickSubmit()
  if (success) {
    emit('update:show', false)
  }
}

const handleClose = () => {
  emit('update:show', false)
}
</script>

<style scoped>
@reference "@/assets/tw-theme.css";
</style>
