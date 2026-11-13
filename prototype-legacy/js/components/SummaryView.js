// ========================================================
// 页面 4：总结 (SummaryView) —— 沉静书写与复盘
// ========================================================

window.SummaryView = {
  name: 'SummaryView',
  props: {
    summaries: { type: Array, required: true }
  },
  emits: ['click-summary'],
  template: `
    <section class="px-5 pt-3.5 space-y-2.5">
      <article
        v-for="item in summaries"
        :key="item.id"
        @click="$emit('click-summary', item)"
        class="p-4 rounded-2xl transition-all duration-200 cursor-pointer space-y-2.5 border border-transparent bg-white shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]"
      >
        <div class="flex items-center justify-between text-xs text-zinc-400 font-mono">
          <span class="font-bold text-[14px] text-zinc-900 tracking-tight">{{ item.date }}</span>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">{{ item.period }}复盘</span>
        </div>
        <p class="text-[14px] text-zinc-700 leading-relaxed font-normal">{{ item.text }}</p>
      </article>

      <!-- 空状态 -->
      <div v-if="summaries.length === 0" class="py-16 text-center space-y-3">
        <div class="w-10 h-10 rounded-full bg-white shadow-xs text-zinc-400 flex items-center justify-center mx-auto">
          <lucide-icon name="book-open" :size="18"></lucide-icon>
        </div>
        <p class="text-xs text-zinc-400 font-medium tracking-tight">暂无此周期的复盘记录</p>
      </div>
    </section>
  `
};
