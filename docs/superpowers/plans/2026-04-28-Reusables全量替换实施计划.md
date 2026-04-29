# Reusables 全量替换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `rhythm-mobile` 中安装 React Native Reusables，并将登录页、Day 页及其基础组件全面切换到 Reusables 官方外观与官方推荐组合方式。

**Architecture:** 继续以 `src/components/ui` 作为项目唯一基础组件出口，把 Reusables 官方生成组件和依赖文件落到现有别名体系内。页面层只重写展示结构，不改动 Day 相关查询、状态管理、Supabase 服务和领域模型的职责边界。

**Tech Stack:** Bun, Expo, React Native, NativeWind, Tailwind CSS, React Native Reusables, Expo Router, TypeScript, Jest, React Native Testing Library

---

## 0. 计划说明

基于设计文档：

- `docs/superpowers/specs/2026-04-28-Reusables全量替换设计.md`

执行约束：

- 计划中不包含提交代码步骤。
- 组件目录保持为 `src/components/ui`，不引入第二套 UI 目录。
- 页面信息层级保留现状，视觉与组件组合优先遵循 Reusables 官方默认实现。

### 0.1 执行进度记录

#### 2026-04-29 当前状态

- 已确认 `components.json`、`global.css` 与当前别名配置可直接用于 Reusables。
- 已完成 `bun add -D @react-native-reusables/cli`，`package.json` 与 `bun.lock` 已更新。
- 已执行 `bunx @react-native-reusables/cli@latest add button input text card badge label textarea separator checkbox switch avatar`，CLI 已部分落库：
  - 新增 `src/components/ui/avatar.tsx`
  - 新增 `src/components/ui/checkbox.tsx`
  - 新增 `src/components/ui/icon.tsx`
  - 新增 `src/components/ui/label.tsx`
  - 新增 `src/components/ui/separator.tsx`
  - 新增 `src/components/ui/switch.tsx`
  - 新增 `src/components/ui/textarea.tsx`
  - `package.json` 已追加部分 `@rn-primitives/*` 依赖
- 本轮执行在组件批量生成后被人工中断，`dialog` 尚未安装，基础组件兼容性与类型校验尚未开始。
- `tailwind.config.js` 的 `darkMode: 'class'` 修复和 `src/__tests__/tailwindConfig.test.ts` 回归测试仍保留在工作区。

## 1. 文件结构

### 1.1 重点修改文件

| 文件 | 职责 |
|------|------|
| `components.json` | 对齐 Reusables 组件生成与别名配置 |
| `package.json` | 增加 Reusables 及其依赖 |
| `bun.lock` | Bun 依赖锁文件更新 |
| `tailwind.config.js` | 保持与 Reusables 组件要求一致 |
| `global.css` | 保持 Reusables/NativeWind CSS 入口稳定 |
| `src/lib/utils.ts` | 兼容 Reusables 推荐工具函数 |
| `src/components/ui/button.tsx` | 替换为 Reusables Button |
| `src/components/ui/input.tsx` | 替换为 Reusables Input |
| `src/components/ui/text.tsx` | 替换为 Reusables Text |
| `src/components/ui/card.tsx` | 替换为 Reusables Card |
| `src/components/ui/badge.tsx` | 替换为 Reusables Badge |
| `src/components/ui/label.tsx` | 新增 Label |
| `src/components/ui/textarea.tsx` | 新增 Textarea |
| `src/components/ui/separator.tsx` | 新增 Separator |
| `src/components/ui/checkbox.tsx` | 新增 Checkbox |
| `src/components/ui/switch.tsx` | 新增 Switch |
| `src/components/ui/avatar.tsx` | 新增 Avatar |
| `src/components/ui/dialog.tsx` 或官方对应弹层文件 | 新增官方弹层能力 |
| `app/(auth)/login.tsx` | 登录页改写为官方表单/容器组合 |
| `src/features/day/components/DateSwitcher.tsx` | 日期切换改写 |
| `src/features/day/components/SourceBadge.tsx` | 来源标签改写 |
| `src/features/day/components/ExecutionCard.tsx` | 执行卡片改写 |
| `src/features/day/components/ExecutionTimeline.tsx` | 时间执行区改写 |
| `src/features/day/components/UnscheduledSection.tsx` | 未安排时间区改写 |
| `src/features/day/components/TaskEditorSheet.tsx` | 编辑任务弹层改写 |
| `src/features/day/components/ExecutionReadonlySheet.tsx` | 只读详情弹层改写 |
| `src/features/day/screens/DayScreen.tsx` | Day 页面整体结构收口 |
| `src/features/day/__tests__/DayScreen.test.tsx` | 更新为新结构的关键交互测试 |
| `src/__tests__/tailwindConfig.test.ts` | 保持颜色模式配置回归测试 |

### 1.2 可能新增的辅助文件

| 文件 | 职责 |
|------|------|
| `src/hooks/*` | Reusables 组件要求的辅助 hooks |
| `src/lib/constants.ts` 或同类文件 | 颜色、尺寸、平台差异常量 |

## 2. Task 1：接入 Reusables 基础设施

**Files:**
- Modify: `components.json`
- Modify: `package.json`
- Modify: `bun.lock`
- Modify: `tailwind.config.js`
- Modify: `global.css`
- Test: `src/__tests__/tailwindConfig.test.ts`

- [x] **Step 1: 校验并对齐组件生成配置**

检查 `components.json`，确保别名与当前仓库一致：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "global.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils",
    "hooks": "@/hooks"
  }
}
```

- [x] **Step 2: 安装 Reusables CLI 与基础依赖**

Run:

```bash
bun add -D @react-native-reusables/cli
```

Expected:

```text
package.json 中出现 @react-native-reusables/cli，bun.lock 更新。
```

- [ ] **Step 3: 运行 CLI 预装高频组件**

Run:

```bash
bunx @react-native-reusables/cli@latest add button input text card badge label textarea separator checkbox switch avatar
```

Expected:

```text
src/components/ui 下出现官方组件文件，必要依赖被追加到 package.json。
```

当前进度备注：

- 本步骤已执行过一次，但只完成了部分组件落库。
- 继续实施前，需要先核对现有 `button.tsx / input.tsx / text.tsx / card.tsx / badge.tsx` 是否已被覆盖，及 `lucide-react-native` 等新增依赖是否已完整安装。

- [ ] **Step 4: 补充弹层能力**

Run:

```bash
bunx @react-native-reusables/cli@latest add dialog
```

Expected:

```text
项目中新增官方推荐的弹层组件或其等价文件，供 Day 页两个弹层复用。
```

- [ ] **Step 5: 运行配置回归测试**

Run:

```bash
npm test -- src/__tests__/tailwindConfig.test.ts
```

Expected:

```text
PASS，确认 `tailwind.config.js` 仍保持 `darkMode: 'class'`。
```

## 3. Task 2：替换基础 UI 组件实现

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/text.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/badge.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/separator.tsx`
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/switch.tsx`
- Create: `src/components/ui/avatar.tsx`
- Create: `src/components/ui/dialog.tsx` 或 CLI 生成文件

- [ ] **Step 1: 保留现有导入入口，替换内部实现**

每个基础组件文件继续保留当前导出路径，例如：

```ts
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

目标是业务层 import 不变，只替换组件实现与默认外观。

- [ ] **Step 2: 对齐 Button / Text / Card / Badge 的官方样式与 API**

重点保留这类外部调用兼容性：

```tsx
<Button variant="ghost" onPress={onPress}>
  <Text>关闭</Text>
</Button>

<Card>
  <CardContent>{children}</CardContent>
</Card>
```

需要确认以下行为不丢失：

- `className` 可继续传入
- `variant`、`size` 仍可使用
- `TextClassContext` 或等效能力仍支撑嵌套文本配色

- [ ] **Step 3: 用 Textarea 替代当前多行 Input 的用途**

迁移后，表单中的多行备注输入统一改为：

```tsx
<Textarea
  placeholder="补充说明"
  value={notes}
  onChangeText={setNotes}
/>
```

- [ ] **Step 4: 运行类型检查**

Run:

```bash
bun run typecheck
```

Expected:

```text
PASS，无基础组件导出或 props 类型错误。
```

## 4. Task 3：重写登录页为 Reusables 官方结构

**Files:**
- Modify: `app/(auth)/login.tsx`

- [ ] **Step 1: 用 Card + Input + Button 重写页面骨架**

把当前纯 `View + Pressable + Text` 结构改为官方容器组合，保留两个动作入口：

```tsx
<SafeAreaView className="flex-1 bg-background">
  <View className="flex-1 justify-center p-6">
    <Card>
      <CardHeader>
        <CardTitle>Rhythm</CardTitle>
        <CardDescription>今日执行，从这里开始</CardDescription>
      </CardHeader>
      <CardContent className="gap-3">
        <Button onPress={handleMockLogin}>
          <Text>进入应用（开发模式）</Text>
        </Button>
        <Button variant="secondary" onPress={handleRealLogin}>
          <Text>真实登录</Text>
        </Button>
      </CardContent>
    </Card>
  </View>
</SafeAreaView>
```

- [ ] **Step 2: 保持登录逻辑不变**

这些逻辑必须原样保留：

```ts
setDevMockSession({ id: 'dev', email: 'dev@localhost', user: {} } as any)
router.replace('/(app)/day')
await signInWithPassword('test@example.com', 'password')
```

- [ ] **Step 3: 运行页面相关测试或最小类型校验**

Run:

```bash
bun run typecheck
```

Expected:

```text
PASS，登录页 JSX 结构切换后无类型错误。
```

## 5. Task 4：重写 Day 页列表与区块结构

**Files:**
- Modify: `src/features/day/components/DateSwitcher.tsx`
- Modify: `src/features/day/components/SourceBadge.tsx`
- Modify: `src/features/day/components/ExecutionCard.tsx`
- Modify: `src/features/day/components/ExecutionTimeline.tsx`
- Modify: `src/features/day/components/UnscheduledSection.tsx`
- Modify: `src/features/day/screens/DayScreen.tsx`
- Test: `src/features/day/__tests__/DayScreen.test.tsx`

- [ ] **Step 1: 用官方按钮组重写日期切换**

目标结构：

```tsx
<View className="px-4 py-3">
  <View className="flex-row items-center justify-between">
    <Button variant="ghost" onPress={goPrev}>
      <Text>昨天</Text>
    </Button>
    <View className="items-center">
      <Text className="text-lg font-semibold">今天</Text>
      <Text className="text-sm text-muted-foreground">{dateText}</Text>
    </View>
    <Button variant="ghost" onPress={goNext}>
      <Text>明天</Text>
    </Button>
  </View>
</View>
```

- [ ] **Step 2: 用 Badge 重写来源标签**

来源映射保持不变，只调整承载方式：

```tsx
const sourceLabelMap = {
  task: '个人任务',
  daily_plan: '今日计划',
  habit: '日常习惯',
}
```

- [ ] **Step 3: 用 Card 重写执行项卡片**

执行项卡片统一组合为：

```tsx
<Card>
  <CardHeader>
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1">
        <CardTitle>{item.title}</CardTitle>
        <SourceBadge source={item.source} label={item.categoryLabel} />
      </View>
      <Button variant="ghost" onPress={() => onToggleItem(item)}>
        <Text>{item.completed ? '已完成' : '完成'}</Text>
      </Button>
    </View>
  </CardHeader>
  <CardContent>
    <Text>{timeText}</Text>
    {item.description ? <Text>{item.description}</Text> : null}
  </CardContent>
</Card>
```

- [ ] **Step 4: 重写 DayScreen 页面骨架**

保留当前信息层级，但把页面结构统一切到官方容器组合：

```tsx
<SafeAreaView className="flex-1 bg-background">
  <DateSwitcher date={currentDate} onChange={setCurrentDate} />
  {errors.length > 0 ? <Card>{/* 错误与重试 */}</Card> : null}
  <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
    <ExecutionTimeline ... />
    <UnscheduledSection ... />
  </ScrollView>
  <Button accessibilityLabel="新增任务" onPress={openNewTask}>
    <Text>＋新建任务</Text>
  </Button>
  <TaskEditorSheet ... />
  <ExecutionReadonlySheet ... />
</SafeAreaView>
```

- [ ] **Step 5: 更新 DayScreen 测试断言**

保持关键断言继续成立：

```tsx
expect(screen.getByText('今天')).toBeTruthy()
expect(screen.getByLabelText('新增任务')).toBeTruthy()
expect(screen.getByText('晨间整理')).toBeTruthy()
```

- [ ] **Step 6: 运行 Day 页测试**

Run:

```bash
bun test src/features/day/__tests__/DayScreen.test.tsx --runInBand
```

Expected:

```text
PASS，Day 页关键信息与交互入口保持可用。
```

## 6. Task 5：重写弹层与表单结构

**Files:**
- Modify: `src/features/day/components/TaskEditorSheet.tsx`
- Modify: `src/features/day/components/ExecutionReadonlySheet.tsx`

- [ ] **Step 1: 用官方弹层能力重写任务编辑弹层**

目标结构：

```tsx
<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{task ? '编辑任务' : '新建任务'}</DialogTitle>
    </DialogHeader>
    <View className="gap-3">
      <Label>标题</Label>
      <Input value={title} onChangeText={setTitle} />
      <Label>开始时间</Label>
      <Input value={startTime} onChangeText={setStartTime} />
      <Label>结束时间</Label>
      <Input value={endTime} onChangeText={setEndTime} />
      <Label>备注</Label>
      <Textarea value={notes} onChangeText={setNotes} />
    </View>
  </DialogContent>
</Dialog>
```

- [ ] **Step 2: 保留现有保存和删除逻辑**

这些行为必须继续成立：

```ts
await onSave(
  {
    title,
    startAt: mergeDateAndClock(date, startTime),
    endAt: mergeDateAndClock(date, endTime),
    notes,
    completed: task?.completed ?? false,
  },
  task?.id ?? null
)

await onDelete(task.id)
```

- [ ] **Step 3: 用官方弹层能力重写只读详情弹层**

目标结构：

```tsx
<Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
  <DialogContent>
    <DialogHeader>
      <SourceBadge source={item.source} label={item.categoryLabel} />
      <DialogTitle>{item.title}</DialogTitle>
      <DialogDescription>时间：{timeText}</DialogDescription>
    </DialogHeader>
    {item.description ? <Text>{item.description}</Text> : null}
    <View className="flex-row justify-end gap-2">
      <Button variant="ghost" onPress={onClose}>
        <Text>关闭</Text>
      </Button>
      <Button onPress={() => onToggle(item)}>
        <Text>{item.completed ? '取消完成' : '标记完成'}</Text>
      </Button>
    </View>
  </DialogContent>
</Dialog>
```

- [ ] **Step 4: 运行类型检查**

Run:

```bash
bun run typecheck
```

Expected:

```text
PASS，弹层 props、文本输入、按钮组合没有类型错误。
```

## 7. Task 6：完整验证与收口

**Files:**
- Modify: `src/features/day/__tests__/DayScreen.test.tsx`
- Review: `app/(auth)/login.tsx`
- Review: `src/features/day/screens/DayScreen.tsx`

- [ ] **Step 1: 运行 Day 相关测试集合**

Run:

```bash
bun test src/features/day/__tests__/DayScreen.test.tsx --runInBand
bun test src/features/day/__tests__/useDayExecutionItems.test.tsx --runInBand
bun test src/features/day/__tests__/useExecutionItemToggle.test.tsx --runInBand
```

Expected:

```text
PASS，页面结构重写没有影响既有 hook 行为。
```

- [ ] **Step 2: 运行全量类型检查**

Run:

```bash
bun run typecheck
```

Expected:

```text
PASS，所有页面与组件类型通过。
```

- [ ] **Step 3: 人工验证页面行为**

至少验证以下路径：

```text
1. 打开登录页，两个按钮都可见且可点击。
2. 进入 Day 页后，能看到日期切换、执行项列表、未安排时间区、新建任务按钮。
3. 点击 Task 卡片能打开编辑弹层。
4. 点击 DailyPlan/Habit 卡片能打开只读详情弹层。
5. 新建任务、保存任务、删除任务的交互入口仍可用。
```

## 8. 自检结果

- 设计文档中的基础组件替换、登录页重写、Day 页重写、弹层重写、验证策略都有对应任务。
- 计划中没有使用 `TODO`、`TBD`、`后续补齐` 一类占位表述。
- 计划明确保持 `src/components/ui` 为唯一入口，并明确不改动数据层职责，和设计文档一致。
