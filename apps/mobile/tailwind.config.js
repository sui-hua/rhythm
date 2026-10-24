/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', './App.tsx'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // 与 apps/web/src/assets/index.css 的 zinc 设计令牌对齐（oklch → hex）
      // 命名与 shadcn/ui / React Native Reusables 约定一致，键名带连字符生成 text-muted-foreground 等类
      colors: {
        background: '#ffffff',
        foreground: '#09090b',
        card: '#ffffff',
        'card-foreground': '#09090b',
        popover: '#ffffff',
        'popover-foreground': '#09090b',
        primary: '#18181b',
        'primary-foreground': '#fafafa',
        secondary: '#f4f4f5',
        'secondary-foreground': '#18181b',
        muted: '#f4f4f5',
        'muted-foreground': '#71717a',
        accent: '#f4f4f5',
        'accent-foreground': '#18181b',
        destructive: '#dc2626',
        'destructive-foreground': '#ffffff',
        border: '#e4e4e7',
        input: '#e4e4e7',
        ring: '#a1a1aa',
        // 语义色：错误提示沿用 destructive；打卡坚持等正向状态用设计稿的柔和绿
        danger: '#dc2626',
        success: '#4d7c0f',
        task: '#f4f4f5',
        plan: '#f4f4f5',
        habit: '#f4f4f5'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
