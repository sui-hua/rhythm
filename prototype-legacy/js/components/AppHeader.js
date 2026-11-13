// ========================================================
// 通用吸顶导航栏组件 (AppHeader · 具名插槽复用架构)
// ========================================================

window.AppHeader = {
  name: 'AppHeader',
  props: {
    time: { type: String, default: '09:41' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' }
  },
  template: `
    <header class="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-zinc-200/70 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all">
      <!-- 极简灵动岛与原生状态栏 -->
      <div class="pt-3 pb-2 px-7 flex items-center justify-between text-xs font-semibold tracking-tight">
        <span class="font-mono text-[13px] text-zinc-800">{{ time }}</span>
        <div class="w-22 h-4.5 bg-black rounded-full flex items-center justify-center gap-1.5 shadow-xs">
          <div class="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse"></div>
        </div>
        <div class="flex items-center gap-1.5 text-zinc-700">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.28 19.64 10.6 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/></svg>
          <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
        </div>
      </div>

      <!-- 统一插槽导航行：左侧 #title + 右侧 #right -->
      <div class="px-6 pt-1 pb-3 flex items-center justify-between">
        <div class="flex items-center gap-1.5 min-w-0">
          <slot name="title">
            <div v-if="title">
              <h1 class="text-[22px] font-bold tracking-tight text-zinc-900 leading-none">{{ title }}</h1>
              <p v-if="subtitle" class="text-[11px] font-mono text-zinc-400 mt-1">{{ subtitle }}</p>
            </div>
          </slot>
        </div>
        <div class="shrink-0 flex items-center">
          <slot name="right"></slot>
        </div>
      </div>
    </header>
  `
};
