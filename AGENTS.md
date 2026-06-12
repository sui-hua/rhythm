# AGENTS.md

**代理必须信任本文件中的指令，仅在信息不完整时才进行搜索。**

---

## 项目概况

- 项目名称：`rhythm`
- 前端框架：Vue 3（Composition API + `<script setup>`）
- 构建工具：Vite 7
- 样式体系：Tailwind CSS 4（设计令牌在 `src/assets/tw-theme.css`）
- 状态管理：Pinia（`authStore` 启用持久化）
- 数据服务：Supabase
- UI / 工具库：VueUse、Radix Vue、Reka UI
- 语言现状：TypeScript

### 常用命令

```bash
pnpm dev       # 启动开发服务器（修改代码后自动热更新）
pnpm build     # 生产构建（用于验证打包是否正常）
pnpm preview   # 预览生产构建
pnpm vue-tsc   # TypeScript 类型检查（提交前必须通过）
```

### 环境变量

复制 `.env.example` 为 `.env`，填入：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

---

## 关键目录结构

```
src/
├── assets/              # 静态资源、主题配置
│   └── tw-theme.css     # Tailwind 主题定义
├── composables/         # 全局可复用逻辑
├── components/          # 全局通用组件
├── router/              # 路由配置与守卫
│   └── index.ts         # 路由守卫逻辑
├── services/            # 数据库访问服务
│   ├── supabase.ts      # Supabase 客户端配置与 createBase 泛型工厂函数
│   ├── database.ts      # 底层直连与 RPC
│   └── db/              # 各表 CRUD 操作模块
├── stores/              # Pinia 状态管理
│   ├── authStore.ts     # 用户认证（persist: true）
│   ├── dateStore.ts     # 日期状态
│   ├── uiStore.ts       # 界面状态
│   ├── pomodoroStore.ts # 番茄钟状态
│   ├── goalDataStore.ts     # Direction 数据缓存（目标/月度/日计划）
│   ├── goalSelectionStore.ts # Direction 选中与编辑状态
│   └── goalBatchStore.ts    # Direction 批量编辑状态
├── utils/               # 纯工具函数
│   ├── dateFormatter.ts     # 日期格式化
│   ├── formatDuration.ts    # 时长格式化
│   ├── habitFrequency.ts    # 习惯频率匹配
│   ├── dayExecutionItems.ts # 日程条目聚合构建
│   ├── safeAction.ts        # 异步操作统一错误处理
│   ├── audio.ts             # 音效播放
│   ├── throttle.ts          # 节流工具
│   └── goalDayStatus.ts     # 目标日状态计算
└── views/               # 页面视图
    ├── [module]/        # 各业务模块
    │   ├── composables/ # 模块专属逻辑
    │   └── *.vue        # 页面组件
    └── ...
```

---

## 架构约定

### 路由与模块

| 路由 | 模块 | 说明 |
|------|------|------|
| `/direction` | Direction | 长期目标管理，三级级联：`plans → monthly_plans → daily_plans` |
| `/habits` | Habits | 周期行为追踪，包含热力图日历与数据统计 |
| `/day/:year/:month/:day` | Timeline | 每日时间轴，聚合 Task、DailyPlan、Habit 三种数据源 |
| `/month/:year/:month` | Month | 月度视图 |
| `/year/:year` | Year | 年度总览 |
| `/summary` | Summary | 日 / 周 / 月 / 年总结 |

模块文档位于 `docs/modules/`。

### 模块内部架构

**Day 模块（dayStore + useDayActions）：**
- `stores/dayStore.ts`：状态定义、数据拉取（fetchTasks）、computed 派生（dailySchedule 等）
- `views/day/composables/useDayActions.ts`：操作逻辑（完成切换、计时、时间更新、任务顺延）
- dayStore 通过 `useDayActions({ tasks, routeDateContext })` 获取操作函数，职责分离

**Direction 模块状态管理：**
- `stores/goalDataStore.ts`：目标/月度/日计划数据缓存
- `stores/goalSelectionStore.ts`：选中目标、编辑目标、月份切换等 UI 状态
- `stores/goalBatchStore.ts`：批量编辑选中状态与映射表
- `views/direction/composables/modalState.ts`：弹窗显示状态的共享 ref（避免循环依赖）

### 数据层

| 文件 | 导出 | 用途 |
|------|------|------|
| `src/services/supabase.ts` | `createBase`、`default`(supabase) | Supabase 客户端配置与 CRUD 泛型工厂函数 |
| `src/services/database.ts` | `db` | 底层直连与 RPC 调用 |
| `src/utils/safeAction.ts` | `safeAction` | 异步操作统一错误处理包装 |

- `createBase<T>(tableName)` 生成带泛型的标准 CRUD 对象，返回值类型自动推导
- 标准能力：`list`、`getById`、`create`、`update`、`delete`、`query`
- `safeAction(action, errorMessage)` 包装异步操作，捕获错误并 console.error，返回 `T | null`
- 数据库真相源：以 Supabase MCP 查询到的线上真实结构为准
- Direction 模块 RPC：`batch_upsert_daily_plans`、`batch_delete_daily_plans`

### 数据库表结构（2026-06-05 更新）

所有表启用 RLS，`user_id` 外键关联 `auth.users(id)`。`updated_at` 字段通过触发器自动更新。

| 表名 | 主要字段 | 约束与索引 |
|------|----------|------------|
| `task` | id, user_id, title, start_time, end_time, completed, actual_start_time, actual_end_time | FK: user_id → auth.users; 索引: idx_task_user_start(user_id, start_time) |
| `goal` | id, user_id, title, status, category_id, year, carry_over_lookback_days | FK: user_id → auth.users, category_id → goal_categories (ON DELETE SET NULL); CHECK: status IN ('active','completed','archived'), priority 1-3 |
| `goal_months` | id, goal_id, user_id, title, status, month | FK: user_id → auth.users, goal_id → goal; CHECK: status IN ('active','completed','archived') |
| `goal_days` | id, goal_month_id, user_id, title, status, day | FK: user_id → auth.users, goal_month_id → goal_months (ON DELETE CASCADE); CHECK: status IN ('active','completed','archived'); 索引: idx_goal_days_user_day(user_id, day) |
| `goal_categories` | id, user_id, name, sort_order | FK: user_id → auth.users |
| `habit` | id, user_id, title, frequency, target_value, is_archived | FK: user_id → auth.users |
| `habit_logs` | id, habit_id, user_id, value, completed_at, log | FK: user_id → auth.users (DEFAULT auth.uid()), habit_id → habit; 索引: idx_habit_logs_completed(habit_id, completed_at) |
| `summary` | id, user_id, title, content, kind, period_start, period_end | CHECK: kind IN ('daily','weekly','monthly','yearly') |
| `daily_report_log` | id, user_id, report_date | FK: user_id → auth.users |

**关键约定：**
- `goal_days.status` 使用 varchar 枚举：`'active'`(默认) / `'completed'` / `'archived'`，前端直接使用字符串值
- `goal_days` 删除关联的 `goal_months` 时级联删除（ON DELETE CASCADE）
- `goal` 删除关联的 `goal_categories` 时 category_id 置空（ON DELETE SET NULL）
- `habit_logs.user_id` 默认值为 `auth.uid()`，无需前端手动传入

### 路由守卫

- 路由守卫位于 `src/router/index.ts`
- `beforeEach` 依据 `authStore.userId` 判断登录状态
- 未登录用户统一重定向到 `/login`
- 涉及登录态、跳转控制的改动，必须同步检查：路由守卫、`authStore` 数据流、页面初始化依赖

---

## 代码规范

### 通用原则

- **绝对不重复写轮子**：修改或新增功能前，必须先排查仓库内是否有可复用的代码、Composable、组件或工具函数，同时检查是否有成熟的第三方库可以解决，确认不存在后才考虑自行实现
- 使用 `<script setup>` 语法
- 文件结构：`template → script → style`
- 核心业务逻辑放入 `src/views/[module]/composables/`，组件只负责 UI 和状态展示
- 组件保持单一职责，模板超过 200 行时拆分子组件
- 导入路径统一使用 `@/` 别名

### 代码注释要求

注释写在代码上方，简短说明职责、业务含义或实现原因。重点覆盖：页面结构块、状态定义、函数职责、边界处理、非显而易见的副作用、潜在陷阱。

**template 注释：** 每个主要结构块写开始和结束注释

```vue
<template>
  <!--
    组件名称 — 一句话说明核心职责
    主要结构：区域A、区域B、区域C
  -->
  <div class="...">

    <!-- 搜索区开始 -->
    <section class="...">
      <input ... />
      <button ... />
    </section>
    <!-- 搜索区结束 -->

    <!-- 数据表格开始 -->
    <table>
      ...
    </table>
    <!-- 数据表格结束 -->

    <!-- 新增/编辑弹窗 -->
    <Modal v-if="showModal" />

  </div>
</template>
```

**script 注释：** 每个状态变量、每个函数必须加注释

```vue
<script lang="ts" setup>
/**
 * 组件/Composable 的职责说明
 * 数据流：xxx → xxx → xxx
 */

// ── 依赖导入 ──
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// ── Store ──
const authStore = useAuthStore()

// ── Props ──
// 当前任务数据，由父组件传入
const props = defineProps<{ task: Task }>()

// ── Emits ──
// select: 选中任务 | edit: 编辑任务
const emit = defineEmits<{ select: [id: string]; edit: [id: string] }>()

// ── 状态 ──
// 表单提交中，防止重复点击
const submitting = ref(false)
// 当前展开的面板索引，-1 表示全部折叠
const expandedIndex = ref(-1)

// ── 计算属性 ──
// 已完成的任务数量，用于顶部统计
const completedCount = computed(() => props.tasks.filter(t => t.done).length)

// ── 方法 ──
// 提交表单，失败时保留用户输入不重置
async function handleSubmit() {
  // 请求发出前锁定，防止重复提交
  submitting.value = true
  try {
    await api.save(formData.value)
    emit('saved')
  } finally {
    // 请求结束后释放锁定，确保异常场景也能恢复按钮状态
    submitting.value = false
  }
}

// ── 生命周期 ──
// 页面挂载后滚动到上次位置
onMounted(() => {
  scrollToLastPosition()
})
</script>
```

**行内注释对比：**

```ts
// Bad: // 过滤字段
list.filter(f => f.id !== fieldId)

// Good: filter 返回新数组，确保引用变化触发响应式更新
list.filter(f => f.id !== fieldId)

// Good: 解释 WHY、边界条件、副作用
// 延迟 300ms，等待关闭动画结束后再清空数据
setTimeout(() => { data.value = null }, 300)

// 周日映射为 6，周一映射为 0（ISO 8601 标准）
const offset = (firstDayOfWeek + 6) % 7
```

**Composable 注释规范：**

```typescript
// useXxx.ts

import { ref, computed } from 'vue'

// 返回值类型定义
export interface UseXxxReturn {
  state: Ref<Type>
  handleAction: () => void
}

/**
 * Composable 的核心职责
 *
 * 使用场景：xxx 模块的 xxx 功能
 * 数据流：API → store → 组件
 */
export function useXxx(param: Type): UseXxxReturn {
  // 内部状态说明
  const state = ref(initialValue)

  // 派生计算，用于 xxx 展示
  const derived = computed(() => transform(state.value))

  // 操作说明，处理 xxx 场景
  function handleAction() {
    // 关键步骤说明
    state.value = newValue
  }

  return { state, derived, handleAction }
}
```

**Store 注释规范：**

```typescript
// useXxxStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Store 管理的状态域说明
 * persist: true → 状态自动同步到 localStorage，刷新后恢复
 */
export const useXxxStore = defineStore('xxx', () => {
  // ── 状态 ──
  // 当前登录用户 ID
  const userId = ref<string | null>(null)
  // 用户完整信息（兼容 Supabase Auth 返回的 User）
  const user = ref<User | null>(null)

  // ── 计算属性 ──
  // 是否已登录
  const isLoggedIn = computed(() => !!userId.value)

  // ── Actions ──
  // 设置用户信息，同时更新 userId
  function setUser(userData: User) {
    user.value = userData
    userId.value = userData.id
  }

  // 清除登录状态，登出时调用
  function clearAuth() {
    userId.value = null
    user.value = null
  }

  return { userId, user, isLoggedIn, setUser, clearAuth }
}, { persist: true })
```

**工具函数注释规范：**

```typescript
// dateFormatter.ts

/**
 * 将 Date 对象格式化为 YYYY-MM-DD 字符串
 * @example toDateOnly(new Date('2026-06-04')) → '2026-06-04'
 */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 判断两个日期是否为同一天（忽略时分秒）
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * 获取指定月份的第一天偏移量（周一=0, 周日=6）
 * 用于日历网格渲染时计算前置空格数
 */
export function getFirstDayOffset(year: number, month: number): number {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7
}
```

---

## 代理执行规则

### Git 偏好

- 实现计划执行过程中，不要提前提交 commit
- 所有代码编写完成后，再统一进行提交
- 由用户执行最终提交，代理不执行 `git commit`
- 提交前必须检查暂存区：`git status --short`、`git diff --cached --name-status`、`git diff --cached`
- 分批提交时，一个 commit 只表达一个清晰主题，避免混入无关文件；优先精确 `git add <file>`，谨慎使用 `git add .`
- 提交信息使用 Conventional Commits：`<type>(<scope>): <subject>`
- 常用 type：`feat` 新功能、`fix` 修复、`refactor` 重构、`test` 测试、`docs` 文档、`style` 样式、`perf` 性能、`chore` 配置/杂项
- 常用 scope：`day`、`direction`、`habits`、`summary`、`auth`、`router`、`db`、`types`、`ui`、`docs`
- subject 使用中文简洁描述，不超过 72 字符，不以句号结尾，如 `fix(day): 保留回溯范围内的未完成目标日计划`
- 推荐分批顺序：回归测试 → 业务修复/功能实现 → 架构重构 → 文档更新

### 代理协作偏好

- 方案、计划、总结优先沉淀到仓库文档，不只保留在对话中
- 如果新增计划文档，使用中文编写，文件名使用中文
- 计划文档需要明确目录、文件、改动点和影响范围，避免模糊表达
- 修改前先理解对应模块文档、数据流和 Composable 入口，避免直接在组件表层修补

---

## 常见错误与反模式

| 错误类型 | 错误做法 | 正确做法 |
|----------|----------|----------|
| 重复造轮子 | 手写日期工具函数 | 使用 VueUse 的 `useDateFns` 等已有封装 |
| 组件臃肿 | 300+ 行单文件组件 | 拆分为子组件 + Composables |
| 样式冲突 | 硬编码颜色值 `#fff` | 使用 Tailwind token `bg-white` |
| 响应式丢失 | 直接修改 reactive 属性 | 使用解构后赋值或 `Object.assign` |
| 状态分散 | 逻辑散落在多个组件 | 收敛到 `composables/` 统一管理 |
| 忽略类型 | 跳过 `vue-tsc` 检查 | 提交前必须通过类型检查 |

---

## 工作流指导

### 修改前

1. 阅读对应模块的 `docs/modules/` 文档
2. 检查 `composables/` 是否有可复用逻辑
3. 检查 `components/` 是否有可复用组件
4. 理解数据流和状态管理方式

### 修改中

- 每次改动尽量小且聚焦，便于验证
- 新增功能优先复用现有代码和第三方库
- 保持组件职责单一，复杂逻辑抽取到 Composable

### 修改后

- 运行 `pnpm vue-tsc` 确认类型检查通过
- 运行 `pnpm build` 确认打包正常
- 验证功能在浏览器中正常工作
