# Playwright MCP 测试计划

## 目标

使用 Playwright MCP 对已完成的三个核心模块（Day / Habits / Direction）进行一次性功能验证。

## 测试范围

### 1. Day（时序）模块
- [ ] 时间轴显示正常（00:00-23:00）
- [ ] 侧边栏任务清单显示
- [ ] 添加项目按钮 → 弹窗打开
- [ ] 添加 Task（任务）
- [ ] 添加 DailyPlan（日计划）
- [ ] 任务完成度统计更新

### 2. Habits（习惯）模块
- [ ] 习惯列表加载
- [ ] 今日习惯卡片显示
- [ ] 添加习惯按钮 → 弹窗打开
- [ ] 创建新习惯
- [ ] 习惯打卡功能
- [ ] 习惯日历显示
- [ ] 习惯统计数据

### 3. Direction（所向）模块
- [ ] 使命看板显示
- [ ] 月份导航
- [ ] 添加目标按钮 → 弹窗打开
- [ ] 创建 Plan（计划）
- [ ] 创建 MonthlyPlan（月计划）
- [ ] 创建 DailyPlan（日计划）
- [ ] 分类管理功能

## 测试方法

使用 Playwright MCP 工具进行手动验证：
- `browser_snapshot` - 获取页面结构
- `browser_click` - 点击交互
- `browser_type` / `browser_fill_form` - 表单输入
- `browser_take_screenshot` - 截图留证
- `browser_console_messages` - 检查控制台错误

## 测试顺序

1. Day 模块
2. Habits 模块
3. Direction 模块

## 通过标准

- 页面正常加载，无控制台 Error
- 核心 CRUD 操作正常执行
- 数据正确显示
