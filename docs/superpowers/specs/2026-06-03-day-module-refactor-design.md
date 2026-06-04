# Day 模块重构设计文档

## 1. 概述

### 1.1 目标
全面重构 day 模块，提升代码质量、命名规范和可维护性。

### 1.2 范围
- 修复已知 bug
- 改进代码质量
- 优化命名规范
- 添加符合规范的代码注释
- 创建模块文档

### 1.3 成功标准
- 所有 composables 和组件符合 AGENTS.md 注释规范
- 代码质量提升，无重复代码
- 命名清晰、一致
- 修复 Sidebar.vue 中的 bug
- 创建完整的模块文档
- 通过 `pnpm vue-tsc` 和 `pnpm build` 检查

---

## 2. 当前状态分析

### 2.1 文件结构
```
src/views/day/
├── composables/
│   ├── useActionFeedback.js
│   ├── useAddEventForm.js
│   ├── useDailyReport.js
│   ├── useDayExecutionItems.js
│   ├── useDayModal.js
│   ├── useDayNavigation.js
│   ├── useDragSnap.js
│   └── useTimelineDragSession.js
├── components/
│   ├── AddEventModal.vue
│   ├── DailyReportModal.vue
│   ├── DragTimeTooltip.vue
│   ├── PomodoroTimerModal.vue
│   ├── Sidebar.vue
│   ├── TaskItem.vue
│   ├── TaskItemWrapper.vue
│   ├── Timeline.vue
│   └── TimelineMarker.vue
├── utils/
│   ├── getInitialScrollTarget.js
│   ├── routeDateContext.js
│   ├── sidebarSections.js
│   ├── taskLayoutStyle.js
│   └── timelineLayout.js
└── index.vue
```

### 2.2 已遵循的规范
- ✅ 使用 `<script setup>` 语法
- ✅ 文件结构 `template → script → style`
- ✅ 核心逻辑在 `composables/` 中
- ✅ 组件已拆分（单一职责）
- ✅ 使用 `@/` 别名

### 2.3 需要改进的地方

#### Bug 修复
- ❌ Sidebar.vue 第 33 行 `dayStore.dayStore.dailySchedule` 应该是 `dayStore.dailySchedule`

#### 命名规范问题
- ❌ `useAddEventForm.js` 中的 `form` 变量名太通用，建议改为 `eventForm`
- ❌ `useAddEventForm.js` 中的 `touched` 变量名不清晰，建议改为 `touchedFields`
- ❌ `useAddEventForm.js` 中的 `lastUsedTime` 变量名可以更清晰，建议改为 `lastUsedTimeSlot`
- ❌ `useDayExecutionItems.js` 中的 `startHourVal` 和 `startTimeStr` 变量名可以更清晰
- ❌ `useTimelineDragSession.js` 中的 `pendingMode` 和 `mode` 变量名可以更清晰

#### 代码质量问题
- ❌ `useAddEventForm.js` 中的 `submit` 函数有重复的时间计算逻辑（第 159-163 行和第 183-186 行）
- ❌ `useDayExecutionItems.js` 中的 `buildDayExecutionItems` 函数过长（150 行），需要拆分
- ❌ `useTimelineDragSession.js` 中的 `startBase` 函数名不清晰，建议改为 `initDragBase`
- ❌ `TaskItem.vue` 中的模板逻辑过于复杂，根据时长分为三个布局，需要简化

#### 注释规范问题
- ❌ 注释不足 - AGENTS.md 要求每个状态变量、函数必须加注释
- ❌ 部分组件缺少结构注释 - template 主要块需要开始/结束注释

#### 架构问题
- ❌ `useDayStore.js` 中的 `carryOverUncompletedTasksTo` 函数可以抽取到 composables 中
- ❌ `useDayStore.js` 中的 `handleToggleComplete` 函数可以抽取到 composables 中

#### 文档问题
- ❌ 缺少模块文档 - `docs/modules/` 目录为空

---

## 3. 重构计划

### 3.1 Bug 修复

#### 3.1.1 Sidebar.vue Bug
**问题：** 第 33 行 `dayStore.dayStore.dailySchedule` 应该是 `dayStore.dailySchedule`

**修复：**
```vue
<!-- 修复前 -->
<div v-if="dayStore.dayStore.dailySchedule.length > 0" class="flex flex-col gap-2 pb-24 pt-2">

<!-- 修复后 -->
<div v-if="dayStore.dailySchedule.length > 0" class="flex flex-col gap-2 pb-24 pt-2">
```

### 3.2 命名规范改进

#### 3.2.1 useAddEventForm.js
- `form` → `eventForm`（更明确表示是事件表单数据）
- `touched` → `touchedFields`（更明确表示是字段触摸状态）
- `lastUsedTime` → `lastUsedTimeSlot`（更明确表示是时间槽）
- `markAllTouched` → `markAllFieldsTouched`（更明确表示是字段）
- `resetTouched` → `resetTouchedFields`（更明确表示是字段）
- `touchField` → `markFieldTouched`（更明确表示是标记触摸）

#### 3.2.2 useDayExecutionItems.js
- `startHourVal` → `startHourValue`（避免缩写）
- `startTimeStr` → `startTimeString`（避免缩写）
- `durationHours` → `durationInHours`（更明确）
- `durationStr` → `durationString`（避免缩写）

#### 3.2.3 useTimelineDragSession.js
- `pendingMode` → `pendingDragMode`（更明确表示是拖拽模式）
- `mode` → `dragMode`（更明确表示是拖拽模式）
- `startBase` → `initDragBase`（更明确表示是初始化）

### 3.3 代码质量改进

#### 3.3.1 useAddEventForm.js - 提取重复的时间计算逻辑
```javascript
// 提取公共的时间计算函数
const calculateStartAndEndTime = (hours, minutes, durationValue) => {
  const year = dateStore.currentDate.getFullYear()
  const month = dateStore.currentDate.getMonth()
  const day = dateStore.currentDate.getDate()
  const startTime = new Date(year, month, day, hours, minutes)
  const endTime = new Date(startTime.getTime() + durationValue * 60 * 60 * 1000)
  return { startTime, endTime }
}
```

#### 3.3.2 useDayExecutionItems.js - 拆分长函数
将 `buildDayExecutionItems` 拆分为：
- `processTasks(tasks)` - 处理任务数据
- `processGoalDays(goalDays, targetDateStr)` - 处理目标日数据
- `processHabits(habits, habitLogs)` - 处理习惯数据
- `sortSchedule(schedule)` - 排序日程

#### 3.3.3 TaskItem.vue - 简化模板逻辑
将三个布局（短任务、中任务、长任务）抽取为子组件：
- `TaskItemShort.vue` - 极短信任务布局（< 0.4h）
- `TaskItemMedium.vue` - 中等任务布局（0.4-0.8h）
- `TaskItemLong.vue` - 长任务布局（>= 0.8h）

### 3.4 注释规范

#### 3.4.1 Template 注释规范
每个主要结构块写开始和结束注释：

```vue
<!-- 侧边栏头部开始 -->
<header class="px-6 pt-12 pb-8 shrink-0 mb-2 bg-transparent">
  ...
</header>
<!-- 侧边栏头部结束 -->
```

#### 3.4.2 Script 注释规范
每个状态变量、每个函数必须加注释：

```javascript
// 日期状态管理，获取当前选中的日期
const dateStore = useDateStore()

// 从 dayStore 获取当日任务相关数据和方法
// dayStore.dailySchedule: 当日任务列表
// dayStore.completedCount: 已完成任务数量
// dayStore.handleToggleComplete: 切换任务完成状态的方法
const dayStore = useDayStore()
```

### 3.5 模块文档

创建 `docs/modules/day.md`，包含：
- 模块概述
- 文件结构说明
- 数据流说明
- 关键 composables 说明
- 组件职责说明

---

## 4. 实施步骤

### 4.1 阶段一：Bug 修复
1. 修复 Sidebar.vue 中的 `dayStore.dayStore.dailySchedule` bug

### 4.2 阶段二：命名规范改进
1. useAddEventForm.js - 重命名变量和函数
2. useDayExecutionItems.js - 重命名变量
3. useTimelineDragSession.js - 重命名变量和函数

### 4.3 阶段三：代码质量改进
1. useAddEventForm.js - 提取重复的时间计算逻辑
2. useDayExecutionItems.js - 拆分长函数
3. TaskItem.vue - 简化模板逻辑，抽取子组件

### 4.4 阶段四：Composables 注释
1. useDayNavigation.js - 添加完整注释
2. useDayModal.js - 添加完整注释
3. useDailyReport.js - 添加完整注释
4. useAddEventForm.js - 添加完整注释
5. useDayExecutionItems.js - 添加完整注释
6. useDragSnap.js - 添加完整注释
7. useTimelineDragSession.js - 添加完整注释
8. useActionFeedback.js - 添加完整注释

### 4.5 阶段五：组件注释
1. index.vue - 添加 template 结构注释和 script 注释
2. Sidebar.vue - 添加 template 结构注释和 script 注释
3. Timeline.vue - 添加 template 结构注释和 script 注释
4. TaskItem.vue - 添加 template 结构注释和 script 注释
5. TaskItemWrapper.vue - 添加 template 结构注释和 script 注释
6. AddEventModal.vue - 添加 template 结构注释和 script 注释
7. DailyReportModal.vue - 添加 template 结构注释和 script 注释
8. PomodoroTimerModal.vue - 添加 template 结构注释和 script 注释
9. TimelineMarker.vue - 添加 template 结构注释和 script 注释
10. DragTimeTooltip.vue - 添加 template 结构注释和 script 注释

### 4.6 阶段六：Utils 注释
1. routeDateContext.js - 添加完整注释
2. getInitialScrollTarget.js - 添加完整注释
3. sidebarSections.js - 添加完整注释
4. taskLayoutStyle.js - 添加完整注释
5. timelineLayout.js - 添加完整注释

### 4.7 阶段七：模块文档
1. 创建 `docs/modules/day.md`

---

## 5. 验证标准

### 5.1 代码质量
- 所有 composables 和组件符合 AGENTS.md 注释规范
- 命名清晰、一致，无缩写
- 无重复代码
- 函数职责单一，长度合理
- 无语法错误
- 无未使用的导入

### 5.2 功能验证
- `pnpm vue-tsc` 类型检查通过
- `pnpm build` 打包正常
- 浏览器中功能正常工作

### 5.3 文档完整性
- 模块文档完整
- 注释覆盖所有状态变量和函数

---

## 6. 风险与缓解

### 6.1 风险
- 注释添加过程中可能引入语法错误
- 重构可能影响现有功能

### 6.2 缓解措施
- 每个阶段完成后运行 `pnpm vue-tsc` 和 `pnpm build`
- 保持小步提交，便于回滚
- 重构前后进行功能验证

---

## 7. 时间估算

- 阶段一（Bug 修复）：5 分钟
- 阶段二（命名规范改进）：30 分钟
- 阶段三（代码质量改进）：45 分钟
- 阶段四（Composables 注释）：30 分钟
- 阶段五（组件注释）：45 分钟
- 阶段六（Utils 注释）：20 分钟
- 阶段七（模块文档）：15 分钟

**总计：约 3 小时**

---

## 8. 附录

### 8.1 相关文件
- AGENTS.md - 代码规范
- src/views/day/ - day 模块目录
- docs/modules/ - 模块文档目录

### 8.2 参考资料
- Vue 3 Composition API 文档
- AGENTS.md 注释规范
