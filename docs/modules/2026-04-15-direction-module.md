# Direction 模块文档

## 模块概述

Direction（所向）模块负责长期目标管理，采用三级级联结构：`plans（目标）→ monthly_plans（月度计划）→ daily_plans（每日任务）`。用户可以创建目标、设定执行时间轴、在日历视图中规划每日任务，并通过归档面板编辑已完成的任务。

## 技术栈

- Vue 3 Composition API + `<script setup>`
- Tailwind CSS 4
- Composables 模式
- Supabase 数据库（通过 `safeDb` 封装 + RPC 批量操作）
- Radix Vue UI 组件

## 目录结构

```
src/views/direction/
├── index.vue                              # 所向页面主视图（三栏布局）
├── components/
│   ├── DirectionSidebar.vue               # 左侧目标列表栏
│   ├── GoalRangePicker.vue                # 月份范围时间轴选择器
│   ├── MissionBoard.vue                   # 月度任务板容器
│   ├── MissionBoardMonth.vue               # 单个月份卡片
│   ├── MissionBoardMonthHeader.vue         # 月份卡片头部（标题/时间/时长）
│   ├── MissionBoardMonthBody.vue           # 月份卡片主体（日期网格+批量栏）
│   ├── MissionArchive.vue                  # 右侧任务归档面板
│   ├── ArchiveHeader.vue                   # 归档面板头部
│   ├── ArchiveItem.vue                     # 单条归档记录
│   ├── AddGoalModal.vue                    # 添加/编辑目标弹窗
│   └── CategoryManagementModal.vue         # 目标分类管理弹窗
└── composables/
    ├── useDirectionState.js                # 共享状态定义（plans/月度缓存/选中状态）
    ├── useDirectionFetch.js                # 数据获取（loadPlans/loadMonthlyPlans）
    ├── useDirectionSelection.js            # 选择逻辑（目标/月/日期框选/星期选）
    ├── useDirectionBatch.js                # 批量操作（RPC 批量新增/删除）
    ├── useDirectionTasks.js                # 任务更新（归档内联编辑）
    └── useDirectionGoals.js                # 目标 CRUD（增删改/月份范围同步）
```

## 核心组件说明

### DirectionSidebar.vue
左侧目标导航栏，按分类展示目标列表，支持单击选中、双击编辑目标。底部显示本月任务完成率进度条。

### GoalRangePicker.vue
月份范围时间轴选择器，通过点击切换起始/结束月份，拖拽选择月份区间，确认后同步到数据库并刷新月度计划。

### MissionBoard.vue
月度任务板容器，渲染当前目标 `activeMonthRange` 范围内所有月份卡片。响应目标切换时自动加载对应月度数据。

### MissionBoardMonth.vue
单个月份卡片，包含折叠态头部（显示主要任务标题/时间/时长）和展开态日期网格。

### MissionBoardMonthBody.vue
日期网格区域，支持鼠标框选连续日期、单击切换单日选择状态、点击星期表头快捷选中整周。选中后显示批量输入栏。

### MissionArchive.vue
右侧任务归档面板，展示当前月份有任务的日期列表，支持内联编辑任务标题、时间和时长。

### AddGoalModal.vue
添加/编辑目标弹窗，包含目标名称、月份范围、分类、任务时间、预计时长。编辑模式下显示删除按钮。

### CategoryManagementModal.vue
目标分类管理弹窗，支持新增/删除目标分类，帮助用户组织目标结构。

## Composables 说明

### useDirectionState.js
- **职责**：定义方向模块所有 composables 之间共享的响应式状态和缓存
- **核心状态**：`plans`（目标列表）、`monthlyPlansCache`（月度计划缓存）、`dailyPlansCache`（每日任务缓存）、`selectedGoal`（当前选中目标）、`selectedMonth`（当前月份）、`selectedDates`（选中的日期集合）、`dailyTasks`（每日任务键值存储）、`batchInput`（批量输入内容）

### useDirectionFetch.js
- **职责**：从数据库加载三层数据，通过缓存实现懒加载
- **主要方法**：`fetchData()`（初始化全量数据）、`loadPlans()`、`loadMonthlyPlans(planId)`、`loadDailyPlans(monthlyPlanId)`
- **缓存策略**：`monthlyPlansCache[planId]` 未命中时从 DB 加载；`dailyPlansCache[monthlyPlanId]` 未命中或 `force=true` 时重新加载

### useDirectionSelection.js
- **职责**：处理目标选择、月份展开/折叠、日期范围选择及星期快捷选择
- **主要方法**：`selectGoal(g)`、`toggleMonth(m)`、`startSelection(day)`、`handleMouseEnter(day)`、`endSelection()`、`selectWeekDay(month, weekIndex)`
- **状态**：`isSelecting`（是否正在框选）、`selectedDates[m]`（月份 m 选中的日期数组）

### useDirectionBatch.js
- **职责**：通过 RPC 实现选中日期的批量新增、修改、删除
- **主要方法**：`applyBatchTask()`（批量应用任务内容）、`handleBatchDelete()`（批量删除）
- **RPC 调用**：`batch_upsert_daily_plans`、`batch_delete_daily_plans`

### useDirectionTasks.js
- **职责**：处理归档视图中单个任务的更新
- **主要方法**：`handleUpdateTask(task, payload)` 更新任务标题、时间、时长，并同步到 `dailyTasks` 兼容层

### useDirectionGoals.js
- **职责**：目标 CRUD 及月度计划同步
- **主要方法**：`handleAddGoal()`、`handleEditGoal()`、`handleUpdateGoal()`、`handleDeleteGoal()`、`handleConfirmRange()`、`saveMonthlyPlan()`
- **月份范围同步**：目标月份范围变更时，自动创建/删除受影响的 monthly_plans 记录

## 数据流简述

```
用户选择目标
       ↓
useDirectionFetch.fetchData() 加载目标列表和月度计划
       ↓
selectedGoal 响应式更新 → GoalRangePicker 显示当前范围
       ↓
用户展开某月 → toggleMonth(m)
       ↓
loadMonthlyPlans(planId) 加载月度计划
       ↓
loadDailyPlans(monthlyPlanId) 加载每日任务
       ↓
MissionBoardMonthBody 渲染日期网格 + MissionArchive 渲染归档列表
       ↓
用户框选日期 → 批量输入 → applyBatchTask() → RPC 批量写入 → reload
```

## 数据库表

方向模块使用以下数据库表：

- `plans` - 目标主表（title, category_id, year, task_time, duration, status, priority）
- `monthly_plans` - 月度计划表（plan_id, month, title, description, status, priority, task_time, duration）
- `daily_plans` - 每日任务表（monthly_plan_id, day, title, task_time, duration, status）
- `plans_category` - 目标分类表（name）

## 批量操作 RPC

- `batch_upsert_daily_plans(p_monthly_plan_id, p_user_id, p_items)` - 批量新增/更新每日任务
- `batch_delete_daily_plans(p_monthly_plan_id, p_days)` - 批量删除指定日期的任务
