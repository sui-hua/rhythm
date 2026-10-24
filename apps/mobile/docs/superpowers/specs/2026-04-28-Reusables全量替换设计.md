# Reusables 全量替换设计

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:writing-plans` after this design is approved to create the implementation plan.

**Goal:** 在 `rhythm-mobile` 中安装 React Native Reusables，并以官方外观为准完成基础 UI 层与现有页面展示层的全量替换。迁移后，项目统一使用 Reusables 官方推荐的组件组织方式与视觉风格，保留现有页面的信息层级与业务能力。

**Architecture:** 以 `src/components/ui` 作为唯一基础组件出口，承载 Reusables 官方组件与其依赖封装。业务页面继续通过 `@/components/ui/*` 引用基础组件。Day 页与登录页的展示结构重写为 Reusables 官方推荐的容器、表单、动作区、标签与弹层组合方式，数据 hooks、领域模型与 Supabase 服务保持原职责不变。

**Tech Stack:** pnpm, Expo, React Native, Expo Router, NativeWind, Tailwind CSS, React Native Reusables, TypeScript, TanStack Query, Jest, React Native Testing Library

---

## 1. 目标与范围

### 1.1 目标

- 安装 React Native Reusables 及其官方推荐依赖。
- 使用 Reusables 官方组件替换现有 `src/components/ui/*` 实现。
- 按 Reusables 官方推荐的页面组织方式重写登录页与 Day 页展示层。
- 保留现有页面的信息层级、业务流程、交互入口与数据读写能力。

### 1.2 本次覆盖范围

- 基础组件目录：`src/components/ui/*`
- 登录页：`app/(auth)/login.tsx`
- Day 页面与其展示组件：
  - `src/features/day/screens/DayScreen.tsx`
  - `src/features/day/components/ExecutionTimeline.tsx`
  - `src/features/day/components/ExecutionCard.tsx`
  - `src/features/day/components/TaskEditorSheet.tsx`
  - `src/features/day/components/ExecutionReadonlySheet.tsx`
  - `src/features/day/components/DateSwitcher.tsx`
  - `src/features/day/components/UnscheduledSection.tsx`
  - `src/features/day/components/SourceBadge.tsx`

### 1.3 明确不变部分

- Day 页三路查询与聚合逻辑。
- 任务、计划、习惯的数据模型与 Supabase 服务。
- 现有业务能力边界：
  - `Task` 支持新建、编辑、删除、完成切换
  - `DailyPlan` 与 `Habit` 保持只读详情与完成切换
- 页面信息层级：
  - 日期切换
  - 时间执行区
  - 未安排时间区
  - 新建任务入口
  - 编辑任务弹层
  - 只读详情弹层

## 2. 组件接入策略

### 2.1 基础原则

- 不引入第二套 UI 目录。
- `src/components/ui` 作为项目唯一的基础组件出口。
- 使用 Reusables 官方默认外观，不复刻当前项目已有视觉风格。
- 允许对官方组件做必要的工程化适配，但不重新发明一套新的设计系统。

### 2.2 组件安装策略

本次采用“整套高频组件预装”策略，不只安装当前立刻使用到的组件。至少覆盖以下组件能力：

- `button`
- `input`
- `text`
- `card`
- `badge`
- `avatar`
- `separator`
- `checkbox`
- `switch`
- `textarea`
- `label`
- `dialog` 或官方推荐的弹层能力
- 表单支撑能力与相关底层 primitives

这样做的目的有两个：

- 迁移期间避免“改一个页面再补一个组件”的碎片化安装。
- 为后续页面扩展提供统一组件基线。

### 2.3 目录落点

- 基础组件保留在 `src/components/ui`
- 工具函数继续使用 `src/lib`
- 若 Reusables 组件要求额外 hooks 或辅助文件，落到 `src/hooks` 或 `src/lib`
- 不新增 `reusables/`、`design-system/` 之类的并行目录

### 2.4 import 约定

迁移完成后，业务代码统一继续通过 `@/components/ui/*` 使用组件。这样可以做到：

- 不打散现有 import 约定
- 降低页面切换时的引用噪音
- 让 Reusables 组件成为项目长期稳定入口

## 3. 页面改造策略

### 3.1 登录页

登录页改造成 Reusables 官方表单结构，使用官方按钮、输入框、文本与容器组合，形成清晰的：

- 标题区
- 表单输入区
- 主动作区
- 错误提示区

登录逻辑本身不改，只替换展示与交互容器。

### 3.2 Day 页面

Day 页面重写为 Reusables 官方推荐的组合结构，但保留现有信息层级：

- 顶部日期切换区
- 主执行列表区
- 未安排时间区
- 底部新建任务入口
- 弹层详情与弹层编辑区

页面主体不再基于当前自定义卡片样式继续迭代，而是直接使用：

- 页面容器
- 分组 Card
- Badge 来源标签
- Button 动作按钮
- Input / Textarea 表单输入
- Separator 分隔区块
- Dialog 或官方推荐弹层能力承载编辑与只读详情

### 3.3 ExecutionCard

执行项卡片统一用 Reusables Card 组合承载，保留当前业务信息：

- 标题
- 来源标签
- 时间范围
- 描述
- 完成状态

`Task / DailyPlan / Habit` 的差异保留在数据与文案层，不再通过三套视觉结构分叉。

### 3.4 TaskEditorSheet

任务编辑弹层重写为 Reusables 官方表单组合，保证以下内容完整保留：

- 标题输入
- 开始时间输入
- 结束时间输入
- 备注输入
- 删除动作
- 保存动作
- 错误提示

### 3.5 ExecutionReadonlySheet

只读详情弹层采用 Reusables 官方弹层结构，保留：

- 类型标题
- 执行项标题
- 时间
- 描述
- 完成切换动作

### 3.6 DateSwitcher 与 UnscheduledSection

- `DateSwitcher` 改造成更标准的官方按钮组与文本组合
- `UnscheduledSection` 改造成官方 Card/Section 组合
- `SourceBadge` 改为基于 Reusables Badge 的来源映射封装

## 4. 替换顺序

### 4.1 先接基础设施

1. 安装 Reusables CLI、组件与依赖
2. 校验 `pnpm`、`NativeWind`、`Tailwind`、`components.json` 的兼容性
3. 生成并整理基础组件到 `src/components/ui`

### 4.2 再替换基础组件

先替换现有基础组件实现，确保：

- `Button`
- `Input`
- `Text`
- `Card`
- `Badge`

这些已被页面直接依赖的组件具备稳定 API。

### 4.3 最后重写页面展示层

页面改造顺序按风险从低到高执行：

1. 登录页
2. Day 页来源标签与局部区块
3. Day 页执行卡片
4. Day 页编辑弹层与只读详情弹层
5. Day 页整体结构收口

## 5. 风险与控制

### 5.1 主要风险

- Reusables 官方组件与 Expo 当前版本的依赖兼容性
- Web 与 Native 两端样式行为差异
- 弹层能力与现有 Day 页交互的结构差异
- 全量替换后测试快照与查询语义变化

### 5.2 控制策略

- 只在视图层重构，不主动改动业务 hooks 与数据服务
- 保持现有组件出口路径不变，减少大面积联动
- 先完成基础组件稳定，再推进页面重组
- 对 Day 页关键交互保留或补充测试，防止展示层重写带来行为回退

## 6. 验证策略

### 6.1 自动验证

- 运行类型检查
- 运行现有 Day 页相关测试
- 根据迁移后的结构补充或更新 UI 层测试

### 6.2 人工验证

- 登录页输入与提交行为
- Day 页日期切换
- 执行项列表展示
- 执行项完成切换
- 新建任务
- 编辑任务
- 删除任务
- 只读详情打开与关闭

### 6.3 完成标准

满足以下条件才视为迁移完成：

- Reusables 组件已接入项目并作为唯一基础 UI 体系
- 登录页与 Day 页展示层已切到官方外观与官方推荐组合方式
- 页面信息层级与现有业务能力保持一致
- 类型检查通过
- 关键测试通过

## 7. 本次产出

本次设计批准后，将进入实施计划编写阶段。实施计划会进一步明确：

- 具体安装命令
- 文件级修改清单
- 页面重写分步顺序
- 每一步的验证命令与验收信号
