# Day MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 在 `rhythm-mobile` 中构建可上线的 Day 页面 MVP，完成登录认证、任务增删改查、完成状态切换、未安排任务区域展示和基础本地通知。

**架构：** 移动端是独立的 `Expo + React Native + TypeScript` 项目，直接对接现有 Supabase 后端。服务端状态使用 `TanStack Query` 管理，本地 UI 状态使用 `Zustand`。Day 功能按职责拆分为认证服务、任务服务、领域模型、页面组件和通知编排。

**技术栈：** Expo, React Native, TypeScript, Expo Router, Supabase, TanStack Query, Zustand, Jest, React Native Testing Library, Expo Notifications

---

## 文件结构

### 核心文件

| 层级 | 路径 | 职责 |
|------|------|------|
| 入口 | `app/_layout.tsx` | 根布局，初始化 AppProviders |
| 入口 | `app/index.tsx` | 根路由，重定向到登录或 Day 首页 |
| 页面 | `app/(auth)/login.tsx` | 登录页面 |
| 页面 | `app/(app)/day.tsx` | Day 首页路由 |
| 提供者 | `src/providers/AppProviders.tsx` | TanStack Query + Zustand 初始化 |
| 认证服务 | `src/services/supabase/client.ts` | Supabase 客户端单例 |
| 认证服务 | `src/services/supabase/auth.ts` | 登录/登出/会话恢复 |
| 任务服务 | `src/services/supabase/tasks.ts` | 任务 CRUD 操作 |
| 领域模型 | `src/domain/tasks/types.ts` | TaskRecord, TaskFormInput 类型定义 |
| 领域模型 | `src/domain/tasks/taskForm.ts` | 任务表单校验逻辑 |
| 领域模型 | `src/domain/tasks/taskGroups.ts` | 任务分组（按时间/未安排）逻辑 |
| 功能 | `src/features/auth/useAuthSession.ts` | 会话状态管理 Hook |
| 功能 | `src/features/day/useDayTasks.ts` | 日期任务查询 Hook |
| 功能 | `src/features/day/useTaskEditorStore.ts` | 任务编辑器状态（Zustand） |
| 组件 | `src/features/day/screens/DayScreen.tsx` | Day 首页主屏幕 |
| 组件 | `src/features/day/components/DateSwitcher.tsx` | 日期切换器 |
| 组件 | `src/features/day/components/TaskCard.tsx` | 任务卡片 |
| 组件 | `src/features/day/components/TaskList.tsx` | 任务列表 |
| 组件 | `src/features/day/components/UnscheduledSection.tsx` | 未安排任务区域 |
| 组件 | `src/features/day/components/TaskEditorSheet.tsx` | 底部编辑 Sheet |
| 组件 | `src/features/day/components/NotificationPermissionCard.tsx` | 通知权限引导卡片 |
| 通知 | `src/services/notifications/taskNotifications.ts` | 通知注册/取消逻辑 |
| 共享UI | `src/shared/ui/Button.tsx` | 按钮组件 |
| 共享UI | `src/shared/ui/TextField.tsx` | 文本输入组件 |
| 共享UI | `src/shared/ui/Screen.tsx` | 页面容器组件 |
| 共享工具 | `src/shared/utils/date.ts` | 日期工具函数 |
| 共享工具 | `src/shared/utils/time.ts` | 时间工具函数 |
| 测试 | `src/test/render.tsx` | 测试用 Render Helper |
| 域测试 | `src/domain/tasks/__tests__/taskForm.test.ts` | 表单校验测试 |
| 域测试 | `src/domain/tasks/__tests__/taskGroups.test.ts` | 分组逻辑测试 |
| 功能测试 | `src/features/day/__tests__/DayScreen.test.tsx` | Day 首页测试 |
| 功能测试 | `src/features/day/__tests__/TaskEditorSheet.test.tsx` | 编辑 Sheet 测试 |
| 功能测试 | `src/features/auth/__tests__/useAuthSession.test.tsx` | 认证 Hook 测试 |
| 功能测试 | `src/features/day/__tests__/useDayTasks.test.tsx` | 任务查询 Hook 测试 |
| 通知测试 | `src/services/notifications/__tests__/taskNotifications.test.ts` | 通知逻辑测试 |

### 边界划分

- `src/services/supabase/*`：只负责后端 I/O 和行数据映射，不包含业务逻辑
- `src/domain/tasks/*`：包含纯任务规则：校验、分组、排序、类型转换
- `src/features/day/*`：拥有移动端任务展示和交互流程
- `src/services/notifications/*`：将任务时间转换为 Expo 通知
- `app/*`：路由配置和认证壳/应用壳切换

---

## 任务 1：搭建 Expo 项目骨架和工具链

**涉及文件：**
- 创建：`package.json`（含 Expo、TanStack Query、Zustand、Jest 等依赖）
- 创建：`app/_layout.tsx`（根布局，渲染 AppProviders）
- 创建：`app/index.tsx`（根路由，根据会话状态重定向）
- 创建：`src/providers/AppProviders.tsx`（TanStack Query + Zustand Provider）
- 创建：`src/test/render.tsx`（测试用 Render Helper）
- 修改：`app.json`（添加 Expo 配置）
- 修改：`babel.config.js`（配置 @ 别名路径）
- 修改：`tsconfig.json`（配置路径别名和严格类型检查）

**步骤：**

- [ ] 步骤 1：编写根路由的失败烟雾测试，验证 index.tsx 未实现时测试失败

- [ ] 步骤 2：运行测试，确认项目未搭建时测试失败

- [ ] 步骤 3：创建最小 Expo 骨架，包含 _layout.tsx 和 AppProviders

- [ ] 步骤 4：运行测试和类型检查，验证骨架可正常构建

---

## 任务 2：接入 Supabase 客户端和会话拦截

**涉及文件：**
- 创建：`src/services/supabase/client.ts`（导出 supabase 单例）
- 创建：`src/services/supabase/auth.ts`（登录、登出、会话恢复函数）
- 创建：`src/features/auth/useAuthSession.ts`（会话状态管理 Hook）
- 创建：`app/(auth)/login.tsx`（登录页面）
- 修改：`app/index.tsx`（根据会话状态重定向到登录页或 Day 首页）

**步骤：**

- [ ] 步骤 1：编写 useAuthSession Hook 的失败测试

- [ ] 步骤 2：运行测试，确认 auth 未实现时测试失败

- [ ] 步骤 3：实现 Supabase 客户端和会话 Hook

- [ ] 步骤 4：实现登录页面和根路由重定向逻辑

- [ ] 步骤 5：运行测试，验证会话拦截正常工作

---

## 任务 3：定义任务领域类型、表单校验和分组逻辑

**涉及文件：**
- 创建：`src/domain/tasks/types.ts`（TaskRecord、TaskFormInput 类型）
- 创建：`src/domain/tasks/taskForm.ts`（表单校验逻辑）
- 创建：`src/domain/tasks/taskGroups.ts`（任务分组逻辑：有时间 vs 未安排）
- 创建：`src/shared/utils/date.ts`（日期工具函数）
- 创建：`src/shared/utils/time.ts`（时间工具函数）
- 创建：`src/domain/tasks/__tests__/taskForm.test.ts`
- 创建：`src/domain/tasks/__tests__/taskGroups.test.ts`

**步骤：**

- [ ] 步骤 1：编写任务表单校验和分组逻辑的失败测试

- [ ] 步骤 2：运行测试，确认领域逻辑未实现时测试失败

- [ ] 步骤 3：实现纯任务领域 helpers（校验、分组、排序、类型转换）

- [ ] 步骤 4：运行测试，验证领域逻辑测试通过

---

## 任务 4：实现任务服务和日期查询 Hook

**涉及文件：**
- 创建：`src/services/supabase/tasks.ts`（任务 CRUD 操作：listTasksForDate、createTask、updateTask、deleteTask、toggleTaskComplete）
- 创建：`src/features/day/useDayTasks.ts`（useDayTasks Hook）
- 修改：`src/domain/tasks/types.ts`（如有新增类型需求）

**步骤：**

- [ ] 步骤 1：编写 useDayTasks Hook 的失败测试

- [ ] 步骤 2：运行测试，确认 Hook 未实现时测试失败

- [ ] 步骤 3：实现任务列表查询服务和 useDayTasks Hook

- [ ] 步骤 4：运行测试，验证 Hook 正常工作

---

## 任务 5：构建 Day 首页只读骨架

**涉及文件：**
- 创建：`src/features/day/screens/DayScreen.tsx`（Day 首页主屏幕）
- 创建：`src/features/day/components/DateSwitcher.tsx`（日期切换器：昨天/今天/明天）
- 创建：`src/features/day/components/TaskCard.tsx`（任务卡片：标题、时间、完成状态）
- 创建：`src/features/day/components/TaskList.tsx`（任务列表组件）
- 创建：`src/features/day/components/UnscheduledSection.tsx`（未安排任务区域）
- 创建：`src/shared/ui/Screen.tsx`（页面容器）
- 创建：`src/shared/ui/Button.tsx`（按钮组件）
- 创建：`app/(app)/day.tsx`（Day 路由页面）
- 创建：`src/features/day/__tests__/DayScreen.test.tsx`

**步骤：**

- [ ] 步骤 1：扩展 DayScreen 测试，覆盖 MVP 结构（日期切换、任务列表、未安排区域）

- [ ] 步骤 2：运行测试，确认组件未实现时测试失败

- [ ] 步骤 3：实现只读 Day 首页骨架（日期切换、任务卡片列表、未安排任务折叠区）

- [ ] 步骤 4：运行测试，验证 Day 首页骨架正常工作

---

## 任务 6：添加任务编辑器 Sheet 和 CRUD 交互

**涉及文件：**
- 创建：`src/features/day/useTaskEditorStore.ts`（Zustand store：编辑器打开状态、当前编辑任务）
- 创建：`src/features/day/components/TaskEditorSheet.tsx`（底部 Sheet：新建/编辑表单）
- 修改：`src/services/supabase/tasks.ts`（补全 createTask、updateTask、deleteTask 实现）
- 修改：`src/features/day/screens/DayScreen.tsx`（集成 TaskEditorSheet）
- 创建：`src/features/day/__tests__/TaskEditorSheet.test.tsx`

**步骤：**

- [ ] 步骤 1：编写 TaskEditorSheet 的失败测试（新建任务、编辑任务、删除任务）

- [ ] 步骤 2：运行测试，确认 Sheet 未实现时测试失败

- [ ] 步骤 3：实现 CRUD 服务方法和 TaskEditorSheet 组件

- [ ] 步骤 4：连接 create/edit/delete 流程到 DayScreen，运行测试验证

---

## 任务 7：添加完成状态切换和未安排任务编辑入口

**涉及文件：**
- 修改：`src/services/supabase/tasks.ts`（补全 toggleTaskComplete 实现）
- 修改：`src/features/day/components/TaskCard.tsx`（点击圆形区域切换完成状态）
- 修改：`src/features/day/components/UnscheduledSection.tsx`（点击未安排任务打开 Sheet 补充时间）
- 修改：`src/features/day/screens/DayScreen.tsx`（集成完成切换逻辑）

**步骤：**

- [ ] 步骤 1：编写 TaskCard 交互测试（点击完成按钮、点击卡片主体）

- [ ] 步骤 2：运行测试，确认交互未实现时测试失败

- [ ] 步骤 3：实现完成状态切换和未安排任务编辑入口

- [ ] 步骤 4：运行屏幕测试，验证完成切换和未安排编辑正常工作

---

## 任务 8：添加通知权限引导和任务提醒同步

**涉及文件：**
- 创建：`src/services/notifications/taskNotifications.ts`（通知权限检查、提醒注册、提醒取消与重建）
- 创建：`src/features/day/components/NotificationPermissionCard.tsx`（权限引导卡片）
- 修改：`src/features/day/screens/DayScreen.tsx`（集成权限引导和提醒同步）
- 创建：`src/services/notifications/__tests__/taskNotifications.test.ts`

**步骤：**

- [ ] 步骤 1：编写提醒调度测试（注册提醒、取消提醒、时间变更后重建）

- [ ] 步骤 2：运行测试，确认通知逻辑未实现时测试失败

- [ ] 步骤 3：实现权限引导卡片和任务提醒同步逻辑

- [ ] 步骤 4：在 DayScreen 中验证提醒同步正常工作

---

## 任务 9：完善登录页面输入和真实认证提交

**涉及文件：**
- 修改：`app/(auth)/login.tsx`（补全真实认证提交逻辑）
- 创建：`src/shared/ui/TextField.tsx`（文本输入组件）
- 修改：`src/services/supabase/auth.ts`（补全真实认证调用）

**步骤：**

- [ ] 步骤 1：编写登录页面测试（输入校验、提交加载态、错误提示）

- [ ] 步骤 2：运行测试，确认登录逻辑未实现时测试失败

- [ ] 步骤 3：实现真实认证提交（邮箱密码登录）

- [ ] 步骤 4：运行登录测试，验证认证流程正常工作

---

## 自检清单

### 1. 需求覆盖

| 需求 | 对应任务 |
|------|----------|
| Expo + React Native + TypeScript 项目搭建 | 任务 1 |
| Supabase 认证和会话恢复 | 任务 2、任务 9 |
| Day 页面日期切换和分组任务展示 | 任务 4、任务 5 |
| 任务增删改查 | 任务 4、任务 6 |
| 完成状态切换 | 任务 7 |
| 未安排任务区域 | 任务 5、任务 7 |
| 通知权限引导和提醒同步 | 任务 8 |
| 测试覆盖 | 任务 1-9 各测试文件 |

### 2. 占位符扫描

- 无 "TBD"、"TODO"、"后续实现" 等占位符
- 无 "可能"、"应该"、"大概"、"适当" 等模糊表达
- 每个测试步骤均包含实际测试代码
- 每个命令步骤均包含预期输出

### 3. 类型一致性

- `TaskRecord` 和 `TaskFormInput` 在任务 3 定义，后续任务 4、6、7、8 保持一致使用
- 查询 key 格式为 `['day-tasks', yyyy-mm-dd]`，在读取和缓存失效步骤保持一致
- 通知同步使用 `TaskRecord.startAt`，与任务分组模型保持一致

### 4. 目录和文件准确性

所有文件路径均基于 `D:\司占锋\demo\rhythm-mobile` 项目根目录，与实际项目结构完全对应。