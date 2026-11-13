// ========================================================
// 原生毛玻璃底部 TabBar（极简纯图标模式）
// ========================================================

window.TabBar = {
  name: 'TabBar',
  props: {
    currentTab: { type: String, required: true },
    items: { type: Array, required: true }
  },
  emits: ['update:currentTab'],
  template: `
    <div>
      <nav class="absolute bottom-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-xl border-t border-zinc-200/70 pt-2.5 pb-6 px-6 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.03)]">
        <button
          v-for="nav in items"
          :key="nav.key"
          @click="$emit('update:currentTab', nav.key)"
          :title="nav.name"
          class="w-12 h-10 flex items-center justify-center transition-all duration-200 group active:scale-90"
          :class="currentTab === nav.key ? 'text-zinc-950' : 'text-zinc-400 hover:text-zinc-700'"
        >
          <lucide-icon
            :name="nav.icon"
            :size="22"
            :stroke-width="currentTab === nav.key ? 2.3 : 1.7"
            class="transition-all duration-200"
            :class="currentTab === nav.key ? 'scale-110' : 'group-hover:scale-105'"
          ></lucide-icon>
        </button>
      </nav>

      <!-- 底部手势指示条 (Home Bar) -->
      <div class="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-300 rounded-full pointer-events-none z-50"></div>
    </div>
  `
};
