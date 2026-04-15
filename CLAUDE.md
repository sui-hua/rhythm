# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 生产构建
pnpm preview  # 预览生产构建
```

环境变量配置：复制 `.env.example` 为 `.env`，填入 Supabase 的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_KEY`。

## 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **Vite 7** + Tailwind CSS 4 (CSS-first 配置，通过 `@theme inline` 定义设计 token)
- **Pinia** (状态管理，authStore 启用了 persist 持久化)
- **Supabase** (PostgreSQL + Row Level Security)
- **VueUse** + **Radix Vue** + **Reka UI**
- **TypeScript** (但项目主要使用 JS)

## 架构概览

### 三层视图体系

项目核心是"目标-关键结果-日程"的效能逻辑，通过三个维度组织：

- **Direction (所向)** `/direction` - 长期目标管理，三级级联：`plans → monthly_plans → daily_plans`
- **Habits (习惯)** `/habits` - 周期行为追踪，带热力图日历和数据统计
- **Timeline (时序)** `/day` - 每日时间轴视图，统一聚合 Task、DailyPlan、Habit 三种数据源

其他视图：`/year`（年度总览）、`/month/:monthIndex`（月度视图）、`/summary`（总结）

### 数据层

- **数据库服务**：`src/services/database.js` 统一导出各表的 CRUD 操作
- **Supabase 客户端**：`src/config/supabase.js`，已扩展 `createBase(tableName)` 方法生成标准 CRUD
- **数据库 Schema**：`database/schema.sql`，所有表都配置了 RLS 策略保证用户数据隔离

### 状态管理

- `src/stores/authStore.js` - 用户认证（persist: true）
- `src/stores/dateStore.js` - 日期状态
- `src/stores/uiStore.js` - UI 状态
- `src/stores/pomodoroStore.js` - 番茄钟状态

### Composables 模式

视图级逻辑抽到 `src/views/[module]/composables/` 下，如 `direction/composables/useDirectionGoals.js`。业务逻辑必须通过 Composables 引入，不在组件内部直接处理核心逻辑。

### Vue 3 组件规范

所有 Vue 组件必须遵循以下规范（来源：`.cursor/rules/vue-guidelines.mdc` 和 `.trae/rules/vue.md`）：

1. **使用 `<script setup>` 语法**
2. **组件内部只处理 UI 和状态展示逻辑，核心逻辑要通过 Composables 引入**
   - 先 import Composable（例如：`useCounter`）
   - 在 setup 内调用并解构所需状态和方法
3. **template 使用状态和方法，绑定到元素上**
4. **样式使用 Tailwind，但不要在 template 里直接堆 class**
   - 将公共样式提取到 `<style scoped>` 内，通过 `@apply` 使用 Tailwind 类名
   - 保持样式结构清晰，变量和状态独立
5. **拆分组件**
   - 组件按照功能或职责拆分，每个组件只负责一个功能
   - 如果一个组件超出 300 行，考虑是否可以拆分成多个组件
   - 每个组件的功能要单一，职责要明确
6. **包含完整结构**：template、script、style
7. **结构顺序必须为**：template、script、style
8. **代码风格清晰，必要处加注释，便于理解**
9. **文件引入必须使用 `@` 开头的路径别名**

## Tailwind CSS 4 配置

主题配置在 `src/assets/tw-theme.css`，使用 `@theme inline` 定义设计 token（颜色、圆角等），支持 light/dark 双主题。

## 路由守卫

`src/router/index.js` 中的 `beforeEach` 守卫会检查 `authStore.userId`，未登录重定向到 `/login`。

## 计划与任务

所有的计划位于 `plans/` 目录下：
- 每天一个独立的文件夹，格式为 `YYYY-MM-DD`（如 `/plans/2026-04-04/`）
- 计划文件的命名格式为 `编号-计划名`（如 `01-添加任务计划.md`）

```
plans/
└── 2026-04-04/
    ├── 01-composables重构.md
    └── 02-任务通知功能.md
```

