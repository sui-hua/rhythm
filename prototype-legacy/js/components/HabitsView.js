// ========================================================
// 页面 2：习惯 (HabitsView) —— Apple HIG 极简质感打卡
// ========================================================

window.HabitsView = {
  name: 'HabitsView',
  props: {
    habits: { type: Array, required: true }
  },
  emits: ['toggle-habit', 'click-habit'],
  template: `
    <section class="px-5 pt-3.5 space-y-2.5">
      <div
        v-for="habit in habits"
        :key="habit.id"
        @click="$emit('click-habit', habit)"
        class="group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.99]"
        :class="habit.completedToday
          ? 'border border-zinc-200/80 bg-white/60 shadow-none'
          : 'border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]'"
      >
        <div class="space-y-1 min-w-0 pr-3">
          <h2
            class="text-[15.5px] font-semibold tracking-tight transition-all duration-200 truncate"
            :class="habit.completedToday ? 'text-zinc-400 font-normal line-through decoration-zinc-300' : 'text-zinc-900'"
          >
            {{ habit.title }}
          </h2>
          <div class="flex items-center gap-2">
            <span
              class="text-[11px] font-mono px-2 py-0.5 rounded-md font-medium transition-colors"
              :class="habit.completedToday ? 'bg-zinc-100/60 text-zinc-400' : 'bg-zinc-100 text-zinc-600'"
            >
              连续 {{ habit.streak }} 天
            </span>
            <span class="text-[11px] font-mono text-zinc-400 font-medium">
              {{ habit.frequency }}
            </span>
          </div>
        </div>

        <!-- Apple 21px 规范打卡按钮组件（与 Day 页面复选框完全一致） -->
        <button
          @click.stop="$emit('toggle-habit', habit)"
          class="w-[21px] h-[21px] rounded-full border flex items-center justify-center transition-all duration-200 shrink-0"
          :class="habit.completedToday ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs' : 'border-[1.8px] border-zinc-300 hover:border-zinc-500 bg-white hover:scale-105'"
        >
          <lucide-icon v-if="habit.completedToday" name="check" :size="12" stroke-width="2.8"></lucide-icon>
        </button>
      </div>
    </section>
  `
};
