# 组件分块拆分与 Composables 重构计划

> 状态：计划阶段
> 创建时间：2026-04-04

## 背景

根据项目 Vue 3 组件规范（`.cursor/rules/vue-guidelines.mdc`），组件应按照功能或职责拆分，每个组件只负责一个功能。

本计划包含两部分：
1. **Composables 重构**：将内联业务逻辑提取到 composables
2. **组件分块拆分**：按页面区域拆分大组件

---

## 第一部分：Composables 重构

### 需要重构的组件

| 组件 | 内联逻辑 | 提取目标 |
|------|----------|----------|
| `HabitCalendar.vue` | viewYear/viewMonth 状态、calendarGrid 计算、月份导航、isToday 判断 | `useHabitCalendar.js` |
| `MissionBoardMonthBody.vue` | getMonthOffset、selectWeekDay、isAllSelectedDatesHaveTask | 合并到 `useDirectionSelection.js` |
| `HabitLogs.vue` | formattedLogs 计算属性 | 合并到 `useHabitLogs.js` |

### 重构步骤

#### 步骤 1：提取 useHabitCalendar.js

**新增**：`src/views/habits/composables/useHabitCalendar.js`

需提取的逻辑：
- `viewYear`、`viewMonth` 状态（ref）
- `calendarGrid` 计算属性
- `monthName` 计算属性
- `handlePrevMonth` / `handleNextMonth` 方法
- `isToday` 方法
- `emitMonthChange` 方法

#### 步骤 2：扩展 useDirectionSelection.js

**修改**：`src/views/direction/composables/useDirectionSelection.js`

需添加的方法：
- `getMonthOffset(month)` - 获取月份偏移
- `selectWeekDay(month, weekIndex)` - 按星期选择
- `isAllSelectedDatesHaveTask(month)` - 判断选中日期是否都有任务

#### 步骤 3：扩展 useHabitLogs.js

**修改**：`src/views/habits/composables/useHabitLogs.js`

添加 `useHabitLogsFormatter(logs)` 函数，返回 `formattedLogs` 计算属性。

---

## 第二部分：组件分块拆分（按页面区域）

### habits/index.vue 区域拆分

```
habits/index.vue
├── HabitSidebar.vue        # 左侧边栏（习惯列表 + 完成度进度）
├── HabitHeader.vue         # [新拆] 标题区域：selectedHabit.title
├── HabitStats.vue          # 统计数据网格
├── HabitCalendar.vue       # 日历组件
├── HabitTodayCard.vue      # [新拆] 今日打卡卡片（输入框 + 提交按钮）
└── HabitLogs.vue           # 历史打卡日志列表
```

**新拆组件说明**：

| 组件 | 来源 | 说明 |
|------|------|------|
| `HabitHeader.vue` | 从 index.vue 提取 lines 17-20 | 显示习惯标题 |
| `HabitTodayCard.vue` | 从 index.vue 提取 lines 31-51 | 今日打卡输入卡片 |

### direction/index.vue 区域拆分

```
direction/index.vue
├── DirectionSidebar.vue     # 左侧目标导航
├── GoalRangePicker.vue      # 月份范围选择器
├── MissionBoard.vue        # 月度任务看板容器
│   └── MissionBoardMonth.vue (循环)
│       └── MissionBoardMonthBody.vue
│       └── MissionBoardMonthHeader.vue
├── MissionArchive.vue      # 右侧任务归档（可进一步拆分）
│   ├── ArchiveHeader.vue   # [新拆] 归档头部：月份标题 + 周期密度
│   └── ArchiveItem.vue     # [新拆] 归档项：单个日期任务行
└── AddGoalModal.vue        # 添加/编辑目标弹窗
```

**MissionArchive.vue 拆分**：

| 新组件 | 说明 |
|--------|------|
| `ArchiveHeader.vue` | 归档头部（月份标题 + 密度统计） |
| `ArchiveItem.vue` | 单个日期任务行（含输入编辑功能） |

### day/index.vue 区域拆分

```
day/index.vue
├── Sidebar.vue              # 左侧任务列表
├── Timeline.vue             # 时间轴主区域
├── AddEventModal.vue        # 添加/编辑事件弹窗
├── MobileAddEventDrawer.vue # 移动端抽屉
├── DailyReportModal.vue     # 日报告弹窗
└── PomodoroTimerModal.vue   # 番茄钟弹窗
```

**分析**：day/index.vue 结构清晰，各区域已独立组件，无需进一步拆分。

---

## 完整文件变更清单

### Composables 重构

| 操作 | 文件 |
|------|------|
| 新增 | `src/views/habits/composables/useHabitCalendar.js` |
| 修改 | `src/views/habits/components/HabitCalendar.vue` |
| 修改 | `src/views/direction/composables/useDirectionSelection.js` |
| 修改 | `src/views/direction/components/MissionBoardMonthBody.vue` |
| 修改 | `src/views/habits/composables/useHabitLogs.js` |
| 修改 | `src/views/habits/components/HabitLogs.vue` |

### 组件分块拆分

| 操作 | 文件 |
|------|------|
| 新增 | `src/views/habits/components/HabitHeader.vue` |
| 新增 | `src/views/habits/components/HabitTodayCard.vue` |
| 修改 | `src/views/habits/index.vue` |
| 新增 | `src/views/direction/components/ArchiveHeader.vue` |
| 新增 | `src/views/direction/components/ArchiveItem.vue` |
| 修改 | `src/views/direction/components/MissionArchive.vue` |

---

## 验证方式

1. `pnpm dev` - 开发服务器正常启动
2. `pnpm build` - 生产构建通过
3. 手动测试：
   - **习惯模块**：月份切换、打卡操作、添加习惯
   - **Direction 模块**：批量选择、任务归档编辑
   - **Day 模块**：时间轴拖拽、任务编辑、番茄钟
