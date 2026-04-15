# Day 模块文档

## 模块概述

Day 模块（`/day` 路由）是效能应用的每日时间轴视图，统一聚合 **Task（任务）**、**DailyPlan（今日计划）**、**Habit（习惯）** 三种数据源，提供日程浏览、编辑、计时和快速添加功能。

### 目录结构

```
src/views/day/
├── index.vue                      # 主页面
├── components/
│   ├── Timeline.vue               # 时间轴组件
│   ├── TimelineMarker.vue        # 当前时间指示器
│   ├── TaskItem.vue              # 任务项组件
│   ├── Sidebar.vue               # 侧边栏（任务列表）
│   ├── AddEventModal.vue         # 桌面端新增/编辑弹窗
│   ├── MobileAddEventDrawer.vue  # 移动端新增/编辑抽屉
│   ├── QuickAddDrawer.vue        # 移动端快速添加抽屉
│   ├── DailyReportModal.vue      # 每日日报弹窗
│   └── PomodoroTimerModal.vue   # 番茄钟计时器弹窗
└── composables/
    ├── useDayData.js             # 核心数据管理
    ├── useDayModal.js            # 模态框状态控制
    ├── useDayNavigation.js       # 导航与初始化
    ├── useAddEventForm.js        # 新增/编辑表单逻辑
    ├── useQuickAddForm.js        # 快速添加表单逻辑
    ├── useDailyReport.js         # 每日日报逻辑
    └── useSwipeToComplete.js     # 左滑完成任务
```

---

## 核心组件说明

### Timeline.vue

**职责**：渲染 24 小时时间轴布局，集成 TaskItem 和 TimelineMarker。

**关键功能**：
- 显示 24 小时背景网格线（每 3 小时为主刻度）
- 使用 CSS Grid 布局算法处理重叠日程的并排显示
- 根据 `dailySchedule` 计算每个任务的位置和高度
- 支持滚动到指定任务

**布局算法**：
- 遍历日程列表，基于开始时间和时长判断是否需要另开列
- 相互不重叠的日程排在同一列，重叠的则并排显示
- 通过 `startHour * var(--hour-height)` 计算垂直位置

---

### TaskItem.vue

**职责**：渲染单个日程项，根据时长动态调整布局样式。

**布局分类**：
| 时长 | 布局样式 |
|------|----------|
| < 0.4h | 极短任务：横向迷你布局，仅显示呼吸点 + 标题 |
| 0.4h ~ 0.8h | 中等任务：横向布局，呼吸点 + 可选中标题 |
| >= 0.8h | 长任务：纵向详细布局，含分类标签、时间、描述、操作按钮 |

**交互**：
- 单击：选中并滚动到 Timeline
- 双击：打开编辑弹窗
- 计时中：显示计时器入口和实时耗时
- 超时：红色警告显示

---

### PomodoroTimerModal.vue

**职责**：任务计时模态框，提供番茄钟式专注计时。

**功能**：
- 全屏居中大号计时器显示
- SVG 圆环进度条展示剩余时间
- 超时警告（红色放大效果）
- 完成按钮：记录 `actual_end_time` 并切换任务完成状态

**状态来源**：`pomodoroStore.activeTask`，包含 `title`、`original.duration` 等

---

### QuickAddDrawer.vue

**职责**：移动端快速添加抽屉，仅需标题即可创建任务。

**特点**：
- 默认使用上次的时间和时长（0.5h）
- 回车键快速提交
- 提供"更多选项"跳转完整编辑模式

---

## Composables 说明

| Composable | 用途 |
|------------|------|
| `useDayData` | **核心数据层**：获取 Task/DailyPlan/Habit 数据，统一聚合到 `dailySchedule`；提供 `fetchTasks`、`handleToggleComplete`、`handleStartTask` 等操作方法 |
| `useDayModal` | 管理新增/编辑弹窗状态，`editingTask` 通过索引从 `dailySchedule` 获取 |
| `useDayNavigation` | 页面初始化：路由校验、数据加载、当前时间更新、首次进入触发日报弹窗 |
| `useAddEventForm` | 新增/编辑表单状态管理，支持 Task 和 Habit 两种类型，含验证逻辑和 CRUD |
| `useQuickAddForm` | 快速添加表单，仅需标题，默认时间和时长，保存历史记录 |
| `useDailyReport` | 每日日报：统计昨日完成/未完成、今日总数，计算可顺延任务 |
| `useSwipeToComplete` | 左滑完成任务交互（移动端），阈值 50%，含震动反馈和音效 |

---

## 数据流简述

```
useDayNavigation (onMounted)
    │
    ├── validateDayRoute()        # 校验路由参数
    ├── syncDateWithRoute()       # 同步日期到 dateStore
    ├── handleFirstEntryForDay()  # 首次进入触发日报
    │
    ▼
useDayData.fetchTasks()
    │
    ├── db.tasks.list()           # 获取当日 Task
    ├── db.dailyPlans.listByDate() # 获取当日 DailyPlan
    ├── db.habits.listLite()      # 获取所有 Habit
    └── db.habits.listLogsByDate() # 获取当日 Habit 日志
    │
    ▼
dailySchedule (computed)
    │
    ├── 转换 Task → { type: 'task', startHour, durationHours, ... }
    ├── 转换 DailyPlan → { type: 'daily_plan', ... }
    └── 转换 Habit → { type: 'habit', completed: habitLogIds.has(id) }
    │
    ▼
Timeline.vue → displaySchedule (布局计算) → TaskItem 渲染
```

**状态更新流程**：
1. 用户操作（完成/编辑/新增） → composable 方法
2. 调用 `db.tasks/habits/dailyPlans` CRUD
3. 成功后调用 `fetchTasks({ showLoading: false })` 刷新数据
4. `dailySchedule` 自动更新，Timeline 响应式重渲染

---

## 关键交互

| 操作 | 触发方式 | 涉及组件/方法 |
|------|----------|---------------|
| 新增任务 | 侧边栏"添加项目"按钮 | `useDayModal.openAddModal()` |
| 编辑任务 | 双击任务项 | `useDayModal.openEditModal(index)` |
| 完成任务 | 勾选 Checkbox / 左滑 | `useDayData.handleToggleComplete()` |
| 开始计时 | 点击"执行"按钮 | `useDayData.handleStartTask()` → `pomodoroStore.setActiveTask()` |
| 快速添加 | 移动端 FAB 按钮 | `QuickAddDrawer` → `useQuickAddForm.quickSubmit()` |
| 日报顺延 | 日报弹窗"确认转移" | `useDayData.carryOverUncompletedTasksTo()` |
