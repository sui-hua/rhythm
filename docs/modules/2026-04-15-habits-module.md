# Habits 模块文档

## 模块概述

Habits 模块负责周期行为追踪，提供习惯管理、热量日历展示和打卡统计功能。用户可以创建习惯、每日打卡、查看历史记录和统计数据。

## 技术栈

- Vue 3 Composition API + `<script setup>`
- Tailwind CSS
- Composables 模式
- Supabase 数据库（通过 `db.habits` 封装）

## 目录结构

```
src/views/habits/
├── index.vue                          # 习惯页面主视图
├── components/
│   ├── AddHabitModal.vue               # 新建习惯弹窗
│   ├── EditHabitModal.vue              # 编辑/删除/归档习惯弹窗
│   ├── HabitCalendar.vue               # 月度热量日历网格
│   ├── HabitHeader.vue                 # 习惯标题头部
│   ├── HabitLogs.vue                  # 历史打卡日志列表
│   ├── HabitSidebar.vue                # 左侧习惯列表导航
│   ├── HabitStats.vue                  # 统计数据看板
│   └── HabitTodayCard.vue             # 今日快速打卡卡片
└── composables/
    ├── useHabitCalendar.js             # 日历视图状态和导航逻辑
    ├── useHabitData.js                  # 习惯数据获取和管理
    ├── useHabitLogs.js                  # 打卡记录操作（增删）
    └── useHabitStats.js                 # 统计指标计算
```

## 核心组件说明

### HabitSidebar.vue
左侧导航栏，展示习惯列表和今日完成度进度条，支持添加新习惯。

### HabitCalendar.vue
月度日历网格组件，显示已打卡日期的高亮标记，支持月份切换。

### HabitStats.vue
统计数据看板，展示本月打卡天数、年度总计、完成率、当前连击等指标。

### HabitTodayCard.vue
今日打卡卡片，提供快速输入框让用户记录习惯心得并提交打卡。

### HabitLogs.vue
历史打卡日志列表，按时间降序展示每条打卡记录。

### AddHabitModal.vue / EditHabitModal.vue
新建和编辑习惯的弹窗组件，包含习惯名称、时间和时长设置。

## Composables 说明

### useHabitData.js
- **职责**：获取习惯列表、维护当前选中习惯、日历视图年月状态
- **主要方法**：`fetchHabits()`、`handleMonthChange()`
- **数据**：habits（活跃）、archivedHabits（归档）、selectedHabit

### useHabitCalendar.js
- **职责**：封装日历视图的年月状态、月份导航、日期高亮判断
- **主要方法**：`handlePrevMonth()`、`handleNextMonth()`、`isToday()`
- **数据**：calendarGrid、monthName、viewYear、viewMonth

### useHabitLogs.js
- **职责**：封装打卡记录的增删操作和日志格式化
- **主要方法**：`toggleComplete()`（切换打卡状态）、`handleQuickLog()`（快速打卡）
- **格式化**：`useHabitLogsFormatter()` 将原始日志转为展示格式

### useHabitStats.js
- **职责**：计算今日完成率和选中习惯的统计数据
- **主要方法**：无（纯计算属性）
- **数据**：todayCompletionRate、habitStats

## 数据流简述

```
用户操作（日打卡/翻页/切换习惯）
       ↓
useHabitData.fetchHabits() 从数据库拉取数据
       ↓
数据加工（过滤当月日志、计算已完成天数）
       ↓
更新 selectedHabit 反应性状态
       ↓
各子组件通过 props 接收并渲染：
  - HabitCalendar → 高亮已打卡日期
  - HabitStats → 显示统计指标
  - HabitLogs → 渲染历史记录
  - HabitTodayCard → 显示今日打卡状态
```

## 数据库表

习惯模块使用以下数据库表：
- `habits` - 习惯主表（title, task_time, duration, frequency, is_archived）
- `habit_logs` - 打卡日志表（habit_id, completed_at, log）
