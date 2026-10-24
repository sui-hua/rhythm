# Day 页面 UX 优化设计方案

## 概述

基于 [Day 页面 UX 分析报告](./2026-04-14-day-page-ux-analysis.md)，制定 Day 页面优化方案。优化聚焦移动端入口梳理、任务创建体验、表单验证、显示格式统一、触摸反馈和辅助功能 6 个方面。

本方案以“低认知负担、移动端优先、保持 Day 页只处理当天任务”为设计边界，不扩展跨天任务创建能力，不改动数据库 schema。

---

## 1. 移动端主入口梳理

### 现状
- Day 页移动端存在两个不同入口：
  - 浮动按钮触发 Quick Add
  - 侧边栏内按钮触发完整创建流程
- 当前浮动按钮使用 Menu/X 图标，容易让用户误解为“导航开关”
- 侧边栏本身已从左侧滑入，不存在“从右侧滑入”的问题

### 方案
- **明确入口职责**：
  - 一个入口负责“打开侧边栏”
  - 一个入口负责“新增任务”
- **浮动主按钮重命名语义**：不再复用 Menu/X 作为新增任务按钮图标
- **移动端关闭按钮**：触摸热区统一达到 `44x44px`
- **侧边栏保持左侧滑入**：不对抽屉方向做无效修改

### 涉及文件
- `src/views/day/index.vue`
- `src/views/day/components/Sidebar.vue`

---

## 2. 任务时间选择器升级

### 现状
- 桌面端已有 `TimePicker` / `DurationPicker`
- 移动端仍使用原生 `type="time"` 和自由数字输入
- 时间选择体验在桌面和移动端不一致
- Day 页当前仅围绕 `dateStore.currentDate` 创建当天任务

### 方案
- **统一交互模型**：移动端与桌面端共用同一套时间/时长选择逻辑，避免长期维护两套体验
- **时间选择器**：升级为更适合触摸选择的滚轮/列表式时间选择，不要求引入日期维度
- **时长选择器**：支持常用分钟档位快速选择，同时保留手动输入能力
- **日期选择**：不加入。Day 页只处理“当前选中日期”的任务，不提供“明天/本周”快捷预设

### 涉及文件
- `src/components/ui/TimePicker.vue`
- `src/components/ui/DurationPicker.vue`
- `src/views/day/components/AddEventModal.vue`
- `src/views/day/components/MobileAddEventDrawer.vue`

---

## 3. 表单验证改进

### 现状
- "确认创建"按钮禁用状态不够明显
- 无实时验证提示
- 移动端和桌面端校验反馈不一致
- 当前提交逻辑只在 `submit()` 时做最基础空值判断

### 方案
- **按钮状态**："确认创建"按钮禁用时使用更明显的灰色 + 降低透明度
- **实时验证**：输入框下方添加验证提示（如"任务名称不能为空"）
- **必填提示**：必填字段添加星号标记
- **校验规则收敛到 composable**：避免桌面端和移动端各自维护一套校验逻辑
- **最小规则**：
  - 任务名称必填
  - 开始时间必填
  - 时长必须大于 0

### 涉及文件
- `src/views/day/components/AddEventModal.vue`
- `src/views/day/components/MobileAddEventDrawer.vue`
- `src/views/day/composables/useAddEventForm.js`

---

## 4. 移动端弹出层整合

### 现状
- Quick Add（快速添加）和 New Task（完整模式）两个弹出层同时存在，可能导致用户困惑
- 当前 Quick Add 与完整表单分别由不同组件和 composable 管理，存在重复状态

### 方案
- **合并流程**：统一为单一任务创建入口
- **默认简化**：显示简化表单（任务名称 + 当天时间/时长快捷项）
- **展开完整**：点击“更多选项”展开时间、时长、描述、分类等字段
- **保持 Day 页边界**：快捷项只能作用于“当天”，例如“现在开始 / 30 分钟 / 1 小时 / 今晚”
- **实现策略**：优先合并交互和状态管理，不强求首轮就物理删除所有旧组件，但最终用户只感知一个入口、一条流程

### 涉及文件
- `src/views/day/index.vue`
- `src/views/day/components/QuickAddDrawer.vue`
- `src/views/day/components/MobileAddEventDrawer.vue`
- `src/views/day/composables/useQuickAddForm.js`
- `src/views/day/composables/useAddEventForm.js`

---

## 5. 时长显示格式统一

### 现状
- 时长显示不一致，如"3.5小时"
- 任务、计划、习惯三类数据在聚合后格式不同

### 方案
- **统一格式**：全中文格式 `3小时30分钟`
- 不再出现小数小时表示
- **统一转换出口**：在时间展示层或格式化工具中集中处理，不在各处拼接字符串

### 涉及文件
- `src/views/day/composables/useDayData.js`
- `src/views/day/components/TaskItem.vue`
- 如有必要，抽取到 `src/utils/` 下的时间格式化工具

---

## 6. 分类按钮优化

### 现状
- 移动端分类按钮宽度受限，长文案可能换行或溢出
- 当前分类按钮没有补充可访问名称

### 方案
- **省略显示**：文字过长时显示省略号
- **完整信息补充**：hover 或长按时显示完整文字
- **优先保证点击热区**：按钮尺寸优先于文案完整展示

### 涉及文件
- `src/views/day/components/AddEventModal.vue`
- `src/views/day/components/MobileAddEventDrawer.vue`

---

## 7. 触摸反馈增强

### 现状
- 按钮按下状态缺乏视觉反馈
- 移动端已有部分 `active:scale`，但反馈不统一
- 时间轴滚动本身由系统原生滚动承接，不应人为重复实现“惯性滚动”

### 方案
- **按钮反馈**：按下时添加缩放 + 颜色变化
- **反馈范围统一**：主要 CTA、图标按钮、分类按钮、抽屉操作按钮统一触摸反馈规范
- **不单独实现惯性滚动**：保留浏览器/系统原生滚动行为，避免引入额外滚动冲突

### 涉及文件
- `src/views/day/index.vue`
- `src/views/day/components/Sidebar.vue`
- `src/views/day/components/QuickAddDrawer.vue`
- `src/views/day/components/MobileAddEventDrawer.vue`
- 通用按钮组件（如有必要）

---

## 8. 辅助功能

### 现状
- 图标按钮缺少 aria-label
- 颜色对比度未检查
- 部分移动端按钮只有图标，没有可读文本

### 方案
- **aria-label**：所有图标按钮添加无障碍标签
- **对比度检查**：确保符合 WCAG AA 标准（至少 4.5:1）
- **抽屉/弹窗语义**：确保标题、关闭按钮、主要操作按钮具备正确语义

### 涉及文件
- `src/views/day/index.vue`
- `src/views/day/components/Sidebar.vue`
- `src/views/day/components/AddEventModal.vue`
- `src/views/day/components/MobileAddEventDrawer.vue`
- `src/views/day/components/QuickAddDrawer.vue`

---

## 实施原则

1. 优先统一入口和表单状态，再做视觉细节优化。
2. 优先复用现有 composable/组件，不新增无必要的表单分支。
3. Day 页不承担跨天调度能力，避免需求边界膨胀。
4. 首轮以“体验统一 + 可用性提升”为目标，不做数据库和业务模型重构。

## 优先级与风险

| 优先级 | 改动项 | 主要涉及 | 风险 |
|--------|--------|----------|------|
| 高 | 移动端主入口梳理 | `index.vue`、`Sidebar.vue` | 中 |
| 高 | 弹出层整合 | `QuickAddDrawer`、`MobileAddEventDrawer`、2 个 composable | 中 |
| 高 | 表单验证改进 | 表单组件 + `useAddEventForm.js` | 低 |
| 中 | 时间选择器升级 | `TimePicker`、`DurationPicker`、移动端表单 | 中 |
| 中 | 时长显示格式统一 | `useDayData.js`、`TaskItem.vue` | 低 |
| 低 | 分类按钮优化 | 表单组件 | 低 |
| 低 | 触摸反馈增强 | 按钮与抽屉相关组件 | 低 |
| 低 | 辅助功能 | Day 页相关组件 | 低 |

## 验收标准

### 交互流程
- 移动端用户能清晰区分“打开侧边栏”和“新增任务”两个入口
- 移动端最终仅保留一条可感知的任务创建流程，不再让用户在 Quick Add 和完整表单之间困惑
- Day 页新增任务仍然默认落在当前选中日期，不支持跨天创建

### 表单体验
- 任务名称为空时，用户在输入框下方能看到明确错误提示
- 开始时间为空或时长非法时，提交按钮不可用且状态明显可辨
- 移动端和桌面端的时间/时长选择体验保持基本一致

### 显示一致性
- Day 页中不再出现 `3.5小时` 这类小数小时文案
- 时长统一显示为中文自然语言格式，如 `30分钟`、`1小时`、`3小时30分钟`

### 可访问性
- 所有仅图标按钮具备 `aria-label`
- 主要按钮、关闭按钮、抽屉标题可被辅助技术正确识别

## 非目标

- 不修改数据库 schema
- 不新增跨天任务创建能力
- 不重构 Day 页核心数据聚合逻辑
