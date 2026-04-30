# Rhythm Mobile UI 重构设计规格

> **For agentic workers:** 本规格指导组件层系统性重构。执行前先阅读 docs/superpowers/plans/ 下的实施计划。组件替换遵循"先审计映射、再按需改造、最后页面验证"的三阶段流程。

**Goal:** 使用 React Native Reusables 重构 rhythm-mobile 组件层，建立完整的组件映射表，分阶段完成组件库和页面层重构，视觉风格与 rhythm web 保持一致。

**Architecture:** 分层策略 — 页面层 (app/) → 组件层 (src/components/ui/) → Reusables 库。组件层先完成 Reusables 映射和改造，验证通过后再推进页面层。API 按需调整，但需同步更新所有调用方。

**Tech Stack:** React Native Reusables (@react-native-reusables/*), React Native, NativeWind, expo-router

---

## 背景与目标

### 背景

rhythm-mobile 当前使用自定义 UI 组件，参考 rhythm web 版的视觉风格（font-extrabold, tracking-tight, 柔和阴影、view-slide 转场），需要系统性重构为 React Native Reusables 组件。

### 目标

1. 建立现有组件与 Reusables 的完整映射关系
2. 按需改造组件 API，确保 TypeScript 编译通过
3. login.tsx 和 day.tsx 使用改造后的组件完成页面重构
4. 页面视觉与 rhythm web 版对齐

---

## 组件映射表

| 现有组件 | Reusables 对应 | 改造策略 | 状态 |
|---------|---------------|---------|------|
| Button | @react-native-reusables/button | 合并 variant 体系，保留 CVA 模式 | 待审计 |
| Card | @react-native-reusables/card | 子组件结构对齐 | 待审计 |
| Text | @react-native-reusables/text | 检查 variant 覆盖度 | 待审计 |
| Separator | @react-native-reusables/separator | 基本一致，可直接替换 | 待审计 |
| Input | @react-native-reusables/input | 检查 variant 和 disabled 状态 | 待审计 |
| Badge | @react-native-reusables/badge | 对齐 variant | 待审计 |
| Dialog | @rn-primitives/dialog | 使用 @rn-primitives/替代 | 待审计 |
| Avatar | @rn-primitives/avatar | 基本一致 | 待审计 |
| Checkbox | @rn-primitives/checkbox | 基本一致 | 待审计 |
| Label | @rn-primitives/label | 基本一致 | 待审计 |
| Switch | @rn-primitives/switch | 基本一致 | 待审计 |
| Textarea | @rn-primitives/textarea | 基本一致 | 待审计 |

---

## 重构范围

### 阶段一：组件层审计与改造 (src/components/ui/)

**涉及文件：**
- src/components/ui/button.tsx
- src/components/ui/card.tsx
- src/components/ui/text.tsx
- src/components/ui/separator.tsx
- src/components/ui/input.tsx
- src/components/ui/badge.tsx
- src/components/ui/dialog.tsx
- src/components/ui/avatar.tsx
- src/components/ui/checkbox.tsx
- src/components/ui/label.tsx
- src/components/ui/switch.tsx
- src/components/ui/textarea.tsx

**任务：**
1. 审计每个组件与 Reusables 的 API 差异
2. 按需改造组件实现（variant 扩展、样式调整）
3. 输出映射表更新（明确哪些组件可直接替换、哪些需改造）
4. 确保 TypeScript 编译通过

### 阶段二：页面层重构

#### 2.1 login.tsx 重构

**涉及文件：**
- app/(auth)/login.tsx

**Before（当前）：**
- Logo: 文字 "R" 在圆角边框内
- 标题: text-4xl font-semibold
- 描述文字较小
- 按钮使用默认样式

**After（目标）：**
- Logo: 使用 lucide-react-native 图标 (Music 或 Calendar)
- 标题: text-5xl font-extrabold tracking-tight
- 描述: lead variant
- 按钮: primary 默认，secondary 次要
- enter/leave 转场动画

#### 2.2 day.tsx 重构

**涉及文件：**
- app/(app)/day.tsx
- src/features/day/screens/DayScreen.tsx

**任务：**
- 应用 rhythm 的 view-slide 转场效果
- 检查并替换组件使用
- 验证样式一致性

### 阶段三：全局样式验证

**涉及文件：**
- global.css

**任务：**
- 检查 CSS 变量与 rhythm web 是否一致
- 确保 hover/active 状态在触摸设备上工作正常

---

## 视觉风格参考 (rhythm web)

| 元素 | 样式值 |
|-----|-------|
| 标题字体 | text-5xl font-extrabold tracking-tight |
| 描述字体 | lead variant |
| 卡片阴影 | shadow-sm shadow-black/5 |
| 转场效果 | view-slide |
| 按钮 hover | hover:bg-primary/90 |
| 按钮 active | active:bg-primary/90 |

---

## 验证方式

- [ ] TypeScript 编译通过 (pnpm typecheck)
- [ ] 组件 variant 覆盖度与设计规格一致
- [ ] login.tsx 视觉与 rhythm web 版对齐
- [ ] day.tsx 组件替换完成并验证
- [ ] 页面转场动画正常

---

## 风险与注意事项

1. **API 不兼容风险** — 部分组件 API 与 Reusables 存在差异，需按需改造并同步更新调用方
2. **转场动画兼容性** — view-slide 在 React Native 中的实现需验证
3. **测试覆盖** — 重构后需确保现有测试通过 (pnpm test)
