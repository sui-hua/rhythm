/**
 * ============================================
 * Day 模块工具函数共享类型 (views/day/utils/types.ts)
 * ============================================
 *
 * 【模块职责】
 * - 定义 day 模块工具函数间共享的类型接口
 * - 包含时间轴任务、侧边栏条目、布局属性等数据结构
 */

import type { DailyScheduleItem } from '@/types/models'

// 时间轴任务基础字段：时间定位与完成状态
export interface TimelineTaskBase {
  startHour?: number
  durationHours?: number
  completed?: boolean
  isCarryOver?: boolean
}

// 布局计算后附加的内部属性（由 timelineLayout 写入）
export interface TimelineLayoutProps {
  /** 原始数组索引，排序前记录 */
  _originalIndex?: number
  /** 列号（从 0 开始） */
  _col?: number
  /** 总列数 */
  _numCols?: number
  /** 是否为堆叠的 carry-over 任务 */
  _isStackedCarryOver?: boolean
  /** 在 carry-over 堆叠中的序号 */
  _stackIndex?: number
  /** carry-over 堆叠总大小 */
  _stackSize?: number
}

// 完整的时间轴任务：DailyScheduleItem 与布局属性的交叉类型
export type TimelineTask = DailyScheduleItem & TimelineLayoutProps

// 侧边栏条目：直接复用 DailyScheduleItem，去除开放索引签名
export type SidebarItem = DailyScheduleItem

// 侧边栏区段：普通条目组或 carry-over 折叠组
export type SidebarSection =
  | { type: 'item'; item: SidebarItem }
  | { type: 'carry-over-group'; label: string; count: number; items: SidebarItem[] }

// 滚动目标定位结果
export type ScrollTarget =
  | { type: 'default-hour'; hour: number }
  | { type: 'task'; index: number }
  | { type: 'current-time'; hour: number }

// 路由日期上下文
export interface RouteDateContext {
  year: number
  month: number
  day: number
  date: Date
  hasParsedParams: boolean
  isCanonical: boolean
}

// 路由年份上下文
export interface RouteYearContext {
  year: number
  hasParsedYear: boolean
  isCanonical: boolean
}

// 路由月份上下文
export interface RouteMonthContext {
  year: number
  month: number
  hasParsedYear: boolean
  hasParsedParams: boolean
  isCanonical: boolean
}
