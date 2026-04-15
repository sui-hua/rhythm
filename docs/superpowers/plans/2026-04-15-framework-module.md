# 框架核心模块文档

## 模块概述

项目基于 Vue 3 + Vite + Vue Router + Supabase，采用 Composables 模式组织业务逻辑，Pinia 管理状态。

---

## 路由配置

**文件：** `src/router/index.js`

### 路由列表

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | LoginView | 登录页 |
| `/` | redirect → /day | 首页重定向 |
| `/year` | YearView | 年度总览 |
| `/month/:monthIndex` | MonthView | 月度视图 |
| `/day` | DayView | 今日时间轴 |
| `/day/:monthIndex/:day` | DayView | 指定日期时间轴 |
| `/habits` | HabitsView | 习惯追踪 |
| `/direction` | DirectionView | 目标管理 |
| `/summary` | SummaryView | 总结页面 |

### 路由守卫

```js
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  // 未登录 → 重定向 /login
  // 已登录访问 /login → 重定向 /
  // 其他情况放行
})
```

关键点：通过 `authStore.userId` 判断登录状态，未登录重定向到 `/login`。

---

## Supabase 配置

**文件：** `src/config/supabase.js`

### 环境变量

- `VITE_SUPABASE_URL` - Supabase 项目地址
- `VITE_SUPABASE_KEY` - Supabase anon 公钥

### 扩展方法

`supabase.createBase(tableName)` - 生成标准 CRUD 对象：

| 方法 | 说明 |
|------|------|
| `list(options)` | 列表查询，支持排序和字段选择 |
| `getById(id)` | 按 ID 查询单条 |
| `create(payload)` | 插入单条 |
| `createMany(payloadArray)` | 批量插入 |
| `update(id, updates)` | 按 ID 更新 |
| `delete(id)` | 按 ID 删除 |
| `query(queryFn)` | 自定义复杂查询 |

---

## 应用入口

**文件：** `src/main.js`

### 初始化顺序

1. 引入全局样式 `main.css`
2. 创建 Vue 应用实例 `createApp(App)`
3. 配置 Pinia + 持久化插件 `piniaPluginPersistedstate`
4. 注册 Pinia 和 Vue Router
5. 挂载到 `#app`

```js
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate) // authStore 等状态持久化
app.use(pinia)
app.use(router)
app.mount('#app')
```

---

## 关联文件

| 文件 | 职责 |
|------|------|
| `src/stores/authStore.js` | 用户认证状态（persist: true） |
| `src/services/database.js` | 统一导出各表 CRUD 操作 |
| `src/App.vue` | 根组件 |
