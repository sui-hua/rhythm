/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}', './App.tsx'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#faf8f2',
        foreground: '#171717',
        card: '#fffdf8',
        border: '#ddd6c8',
        muted: '#6b665d',
        accent: '#1f1f1f',
        task: '#e6efd8',
        plan: '#dce7f2',
        habit: '#efe0bf',
        danger: '#b42318'
      },
      borderRadius: {
        lg: '8px',
        md: '6px',
        sm: '4px'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}
