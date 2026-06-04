/**
 * ============================================
 * 应用入口文件 (main.ts)
 * ============================================
 *
 * 【模块职责】
 * - Vue 3 应用初始化
 * - Pinia 状态管理配置（支持 persist 持久化）
 * - Vue Router 路由挂载
 *
 * 【依赖注入顺序】
 * 1. CSS 样式加载
 * 2. Pinia + 持久化插件
 * 3. Router
 * 4. App 组件挂载
 */

import 'vue-sonner/style.css'
import './assets/main.css'

import { createApp, type App } from 'vue'
import { createPinia, type Pinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import AppView from './App.vue'
import router from './router'

// 创建 Vue 应用实例
const app: App = createApp(AppView)

// 创建 Pinia 实例并启用持久化插件
const pinia: Pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.mount('#app')

