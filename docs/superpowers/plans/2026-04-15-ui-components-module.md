# UI Components 模块文档

## 模块概述

`src/components/ui/` 目录包含基于 **Radix Vue** 和 **Reka UI** 的无头组件库，所有组件均使用 **Tailwind CSS** 进行样式配置。这些组件提供了一套完整的 UI 基础组件，适用于各种业务场景。

## 技术栈

- **Vue 3** (Composition API + `<script setup>`)
- **Radix Vue** - Dialog, Checkbox, Label, Popover, Progress, ScrollArea, Separator 等组件的基础
- **Reka UI** - Select 选择器组件的基础
- **Tailwind CSS 4** - 样式配置

## 组件清单

### Badge

**文件**: `badge/Badge.vue`

徽章/标签组件，用于显示小版本号、状态指示或分类标签。

**Props**:
- `variant`: 变体类型 (`default` | `secondary` | `destructive` | `outline`)
- `class`: 自定义 CSS 类

---

### Button

**文件**: `button/Button.vue`

按钮组件，支持多种变体和尺寸。

**Props**:
- `variant`: 变体 (`default` | `destructive` | `outline` | `secondary` | `ghost` | `link`)
- `size`: 尺寸 (`default` | `sm` | `lg` | `icon`)
- `as`: 渲染元素类型 (默认 `button`)

---

### Card

**文件**: `card/Card.vue`, `card/CardHeader.vue`, `card/CardTitle.vue`, `card/CardDescription.vue`, `card/CardContent.vue`, `card/CardFooter.vue`

卡片容器组件，用于分组展示相关内容。

| 组件 | 用途 |
|------|------|
| `Card` | 卡片容器，提供圆角边框和阴影 |
| `CardHeader` | 卡片头部，包含标题和描述 |
| `CardTitle` | 卡片标题文字 |
| `CardDescription` | 卡片描述文字 |
| `CardContent` | 卡片内容区域 |
| `CardFooter` | 卡片底部，通常放置操作按钮 |

---

### Checkbox

**文件**: `checkbox/Checkbox.vue`

圆形复选框组件，基于 Radix Vue。

**Props**:
- `modelValue`: v-model 绑定值
- `defaultChecked`: 默认选中状态
- `disabled`: 是否禁用

---

### Dialog

**文件**: `dialog/Dialog.vue`, `dialog/DialogTrigger.vue`, `dialog/DialogContent.vue`, `dialog/DialogHeader.vue`, `dialog/DialogTitle.vue`, `dialog/DialogDescription.vue`, `dialog/DialogFooter.vue`

模态对话框组件，基于 Radix Vue。

| 组件 | 用途 |
|------|------|
| `Dialog` | 对话框根组件 |
| `DialogTrigger` | 触发器，包裹要点击打开对话框的元素 |
| `DialogContent` | 对话框内容，包含遮罩层和关闭按钮 |
| `DialogHeader` | 对话框头部 |
| `DialogTitle` | 对话框标题 |
| `DialogDescription` | 对话框描述 |
| `DialogFooter` | 对话框底部，响应式布局 |

---

### Input

**文件**: `input/Input.vue`

文本输入框组件。

**Props**:
- `modelValue`: v-model 绑定值
- `defaultValue`: 默认值
- `class`: 自定义样式

---

### Label

**文件**: `label/Label.vue`

表单标签组件，基于 Radix Vue Label。

**Props**:
- `for`: 关联的输入框 ID
- `class`: 自定义样式

---

### Popover

**文件**: `popover/Popover.vue`, `popover/PopoverTrigger.vue`, `popover/PopoverContent.vue`

弹出层组件，基于 Radix Vue Popover。

| 组件 | 用途 |
|------|------|
| `Popover` | 弹出层根组件 |
| `PopoverTrigger` | 触发器 |
| `PopoverContent` | 弹出层内容区域 |

**PopoverContent Props**:
- `align`: 对齐方式 (`center` | `start` | `end`)
- `sideOffset`: 偏移量 (默认 4)

---

### Progress

**文件**: `progress/Progress.vue`

进度条组件，基于 Radix Vue Progress。

**Props**:
- `modelValue`: 进度值 (0-100)
- `class`: 自定义样式

---

### ScrollArea

**文件**: `scroll-area/ScrollArea.vue`

自定义滚动区域组件，基于 Radix Vue ScrollArea。

**Props**:
- `class`: 自定义样式

**Expose**:
- `viewportElement`: 获取视口元素

---

### Select

**文件**: `select/Select.vue`, `select/SelectTrigger.vue`, `select/SelectContent.vue`, `select/SelectGroup.vue`, `select/SelectLabel.vue`, `select/SelectItem.vue`, `select/SelectItemText.vue`, `select/SelectValue.vue`, `select/SelectScrollUpButton.vue`, `select/SelectScrollDownButton.vue`, `select/SelectSeparator.vue`

选择器组件，基于 Reka UI Select。

| 组件 | 用途 |
|------|------|
| `Select` | 选择器根组件 |
| `SelectTrigger` | 触发按钮 |
| `SelectContent` | 下拉内容 |
| `SelectGroup` | 选项组 |
| `SelectLabel` | 组标签 |
| `SelectItem` | 选项 |
| `SelectItemText` | 选项文本 |
| `SelectValue` | 显示选中值 |
| `SelectScrollUpButton` | 向上滚动按钮 |
| `SelectScrollDownButton` | 向下滚动按钮 |
| `SelectSeparator` | 分隔线 |

---

### Separator

**文件**: `separator/Separator.vue`

分隔线组件，基于 Radix Vue Separator。

**Props**:
- `orientation`: 方向 (`horizontal` | `vertical`)
- `class`: 自定义样式

---

### Sonner

**文件**: `sonner/Sonner.vue`

Toast 通知组件，基于 vue-sonner。

支持的成功/错误/警告/信息/加载等通知类型，内置图标配置。

---

### Textarea

**文件**: `textarea/Textarea.vue`

多行文本输入框组件。

**Props**:
- `modelValue`: v-model 绑定值
- `defaultValue`: 默认值
- `class`: 自定义样式

---

### DurationPicker

**文件**: `DurationPicker.vue`

时长选择器组件，支持小时/分钟单位切换。

**Props**:
- `modelValue`: 时长值 (小时)
- `id`: 表单 ID
- `label`: 标签文字

**用法**:
```vue
<DurationPicker v-model="duration" label="时长" />
```

---

### TimePicker

**文件**: `TimePicker.vue`

24 小时制时间选择器，带 Popover 面板选择。

**Props**:
- `modelValue`: 时间值 (HH:mm 格式)
- `id`: 表单 ID
- `label`: 标签文字
- `placeholder`: 占位符 (默认 "08:00")

**用法**:
```vue
<TimePicker v-model="time" label="时间" />
```

---

### EmptyState

**文件**: `EmptyState.vue`

空状态占位组件，用于无数据时展示引导 UI。

**Props**:
- `title`: 标题
- `description`: 描述

**Slots**:
- `icon`: 自定义图标
- `action`: 操作按钮

**用法**:
```vue
<EmptyState title="暂无数据" description="请先创建任务">
  <template #icon>
    <SomeIcon />
  </template>
  <template #action>
    <Button>创建</Button>
  </template>
</EmptyState>
```

---

### SkeletonTask

**文件**: `SkeletonTask.vue`

任务骨架屏组件，用于加载状态显示，带脉冲动画效果。

无 Props，通过模板内容展示占位结构。

---

## 使用示例

```vue
<script setup>
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>标题</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid gap-4">
        <div>
          <Label for="input">输入框</Label>
          <Input id="input" v-model="value" />
        </div>
        <Button>提交</Button>
      </div>
    </CardContent>
  </Card>
</template>
```
