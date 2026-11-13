// ========================================================
// 页面 3：所向 (DirectionView) —— 优雅目标里程碑
// ========================================================

window.DirectionView = {
  name: 'DirectionView',
  props: {
    goals: { type: Array, required: true }
  },
  emits: ['click-goal'],
  template: `
    <section class="px-5 pt-3.5 space-y-2.5">
      <div
        v-for="goal in goals"
        :key="goal.id"
        @click="$emit('click-goal', goal)"
        class="group p-4 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.99] space-y-3 border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 font-semibold">{{ goal.category }}</span>
            <h2 class="text-[15.5px] font-semibold tracking-tight text-zinc-900 mt-1.5 truncate">{{ goal.title }}</h2>
          </div>
          <span
            class="text-[12px] font-mono font-bold px-2.5 py-0.5 rounded-md shrink-0 transition-colors"
            :class="goal.progress >= 100 ? 'bg-zinc-900 text-white shadow-xs' : 'bg-zinc-100 text-zinc-800'"
          >
            {{ goal.progress }}%
          </span>
        </div>

        <p class="text-xs text-zinc-500 font-medium truncate">{{ goal.milestone }}</p>

        <!-- 极细质感进度条 (Apple 规范 1.5 轨高) -->
        <div class="h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/40">
          <div class="h-full bg-zinc-900 rounded-full transition-all duration-500" :style="{ width: goal.progress + '%' }"></div>
        </div>
      </div>
    </section>
  `
};
