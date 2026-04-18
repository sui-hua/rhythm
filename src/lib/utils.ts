/**
 * ============================================
 * 通用工具函数 (lib/utils.ts)
 * ============================================
 *
 * 【模块职责】
 * - 提供通用的 ClassName 合并工具
 *
 * 【函数说明】
 * - cn() → 合并 Tailwind CSS 类名，自动处理冲突
 *
 * 【依赖】
 * - clsx → 轻量级类名拼接
 * - tailwind-merge → Tailwind CSS 类名合并
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
