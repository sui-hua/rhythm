// ========================================================
// 页面 1：时序 (DayView) —— 精英级精致排印与条目质感
// ========================================================

window.DayView = {
  name: 'DayView',
  props: {
    tasks: { type: Array, required: true }
  },
  emits: ['toggle-task', 'edit-task', 'add-task'],
  template: `
    <section class="px-5 pt-3.5 space-y-4">
      <!-- 待办清单：Apple HIG 精品列表条目（去竖线 · 16pt 标题 · 胶囊微标） -->
      <div class="space-y-2.5 pt-1 pb-4">
        <div
          v-for="task in tasks"
          :key="task.id"
          @click="$emit('edit-task', task)"
          class="group relative flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.99]"
          :class="[
            task.completed
              ? 'border border-zinc-200/80 bg-white/60 shadow-none'
              : (task.isNow
                  ? 'border border-zinc-900/15 bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08),0_2px_4px_0_rgba(0,0,0,0.02)] ring-1 ring-zinc-950/5'
                  : 'border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]')
          ]"
        >
          <!-- 左侧：Apple 21px 规范复选框 + 13px 时间刻度 -->
          <div class="flex items-center gap-3 shrink-0">
            <!-- 复选框交互组件 -->
            <button
              @click.stop="$emit('toggle-task', task)"
              class="w-[21px] h-[21px] rounded-full border flex items-center justify-center transition-all duration-200 shrink-0"
              :class="task.completed ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs' : 'border-[1.8px] border-zinc-300 hover:border-zinc-500 bg-white hover:scale-105'"
            >
              <lucide-icon v-if="task.completed" name="check" :size="12" stroke-width="2.8"></lucide-icon>
            </button>

            <!-- 时间（Apple Footnote 规范 13px 等宽字体） -->
            <span
              class="text-[13px] font-mono tracking-tight select-none transition-colors"
              :class="task.completed ? 'text-zinc-400 font-normal' : (task.isNow ? 'text-zinc-950 font-bold' : 'text-zinc-500 font-medium group-hover:text-zinc-800')"
            >
              {{ task.time }}
            </span>
          </div>

          <!-- 中部：事项主标题（Apple HIG 16pt / 15.5px 半粗体，饱满扎实） -->
          <div class="flex-1 min-w-0 flex items-center pl-0.5">
            <span
              class="text-[15.5px] tracking-tight truncate transition-all duration-200"
              :class="task.completed ? 'line-through decoration-zinc-300 text-zinc-400 font-normal' : (task.isNow ? 'text-zinc-950 font-bold' : 'text-zinc-800 font-semibold group-hover:text-zinc-950')"
              :title="task.title"
            >
              {{ task.title }}
            </span>
          </div>

          <!-- 右侧：时长微胶囊 -->
          <div class="shrink-0 flex items-center">
            <span
              class="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
              :class="task.completed
                ? 'bg-zinc-100/60 text-zinc-400'
                : (task.isNow
                    ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200/80 group-hover:text-zinc-800')"
            >
              {{ task.duration }}m
            </span>
          </div>
        </div>

        <!-- 当日无任务时的白底空状态 -->
        <div v-if="tasks.length === 0" class="py-16 text-center space-y-3">
          <div class="w-10 h-10 rounded-full bg-white shadow-xs text-zinc-400 flex items-center justify-center mx-auto">
            <lucide-icon name="calendar" :size="18"></lucide-icon>
          </div>
          <p class="text-xs text-zinc-400 font-medium tracking-tight">当日暂无待办事项 · 享受平静时光</p>
          <button
            @click="$emit('add-task')"
            class="px-3.5 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold shadow-xs hover:bg-zinc-800 active:scale-95 transition-all"
          >
            + 添加待办
          </button>
        </div>
      </div>
    </section>
  `
};
