// ========================================================
// Lucide 纯正图标组件
// ========================================================

window.LucideIcon = {
  name: 'LucideIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 16 },
    strokeWidth: { type: [Number, String], default: 2 }
  },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="inline-block align-middle shrink-0"
      v-html="svgContent"
    ></svg>
  `,
  computed: {
    svgContent() {
      return (window.LUCIDE_ICONS && window.LUCIDE_ICONS[this.name]) || '';
    }
  }
};
