# Month / Year 模块文档

## 模块概述

Month（月度视图）和 Year（年度总览）模块构成应用的日历浏览层。Year 模块以热力图风格展示全年12个月的完成情况，Month 模块以网格形式展示单月每日详情。两模块均遵循 Composables 模式，业务逻辑外置。

## Month 月度视图

### 页面结构

- `/month/:monthIndex` - 路由路径，如 `/month/4` 表示4月

### 组件说明

| 组件 | 文件 | 职责 |
|------|------|------|
| index.vue | src/views/month/index.vue | 月度视图主入口，使用 useMonthView |
| MonthHeader.vue | src/views/month/components/MonthHeader.vue | 头部导航，含返回按钮和年月标题 |
| MonthGrid.vue | src/views/month/components/MonthGrid.vue | 7列网格布局，渲染上月末尾+当月+下月开头的日期格子 |
| DayCell.vue | src/views/month/components/DayCell.vue | 单日格子，显示日期数字和任务小时指示器 |

### Composables

**useMonthView.js**
- `selectedMonth` - 当前选中月份信息（名称、天数、首日偏移）
- `monthGridData` - 42格日历网格数据（含非当月日期占位）
- `enterDay(date)` - 跳转到指定日
- `goBackToYear()` - 返回年度视图

## Year 年度总览

### 页面结构

- `/year` - 路由路径

### 组件说明

| 组件 | 文件 | 职责 |
|------|------|------|
| index.vue | src/views/year/index.vue | 年度视图主入口，使用 useYearView |
| YearGrid.vue | src/views/year/components/YearGrid.vue | 4列网格布局，渲染12个月份格子 |
| MonthCell.vue | src/views/year/components/MonthCell.vue | 单月格子，显示月名和完成天数小圆点 |

### Composables

**useYearView.js**
- `yearData` - 12个月的数据数组，含完成天数统计
- `enterMonth(month)` - 跳转到指定月度视图

## 数据流简述

```
Year 模块:
  useYearView → 加载 habits 数据 → 按月统计 habit_logs 完成情况 → yearData → YearGrid → MonthCell

Month 模块:
  useMonthView → 解析路由 monthIndex → 加载 tasks 数据 → 生成42格网格 → MonthGrid → DayCell
```

### 数据来源

- Year 模块从 `db.habits.list()` 获取习惯数据，统计 `habit_logs.completed_at`
- Month 模块从 `db.tasks.list(start, end)` 获取任务数据，按日期过滤

### 导航关系

```
/year → 点击月 → /month/:monthIndex → 点击日 → /day/:monthIndex/:date
```
