/**
 * 应用入口文件
 *
 * 负责 Vue 3 应用初始化，按顺序注入：
 * 1. CSS 样式
 * 2. Pinia 状态管理（带持久化插件）
 * 3. Vue Router
 * 4. 挂载到 DOM
 */

// ── 样式导入 ──
import 'vue-sonner/style.css'
import './assets/main.css'

// ── 依赖导入 ──
import { createApp, type App } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import AppView from './App.vue'
import router from './router'

// 创建 Vue 应用实例
const app: App = createApp(AppView)

// 创建 Pinia 实例并启用持久化插件（authStore 依赖此插件）
const pinia: Pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 按顺序注入插件：Pinia → Router
app.use(pinia)
app.use(router)

// 挂载到 DOM
app.mount('#app')

