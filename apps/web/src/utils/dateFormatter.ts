type MonthFormat = 'zh' | 'en' | 'full'

interface DayRange {
  start: Date
  end: Date
}

/**
 * 将月份数字转换为指定语言格式的月份名称
 * @param monthNumber - 1-12 的月份数字（也接受字符串）
 * @param format - 输出格式：'zh' 中文 / 'en' 英文大写 / 'full' 中英双语
 * @returns 月份名称，无效输入返回空字符串
 */
export const getMonthName = (monthNumber: number | string, format: MonthFormat = 'zh'): string => {
  const num = parseInt(String(monthNumber), 10)
  if (isNaN(num) || num < 1 || num > 12) return ''

  const zh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  const en = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
  const full = ['一月 (January)', '二月 (February)', '三月 (March)', '四月 (April)', '五月 (May)', '六月 (June)', '七月 (July)', '八月 (August)', '九月 (September)', '十月 (October)', '十一月 (November)', '十二月 (December)']

  const idx = num - 1
  switch (format) {
    case 'en': return en[idx]!
    case 'full': return full[idx]!
    default: return zh[idx]!
  }
}

/**
 * 将 Date 对象格式化为 YYYY-MM-DD 字符串
 * @example toDateOnly(new Date('2026-06-04')) → '2026-06-04'
 */
export function toDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 判断两个日期是否为同一天（忽略时分秒）
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

// 获取指定日期当天的起止时间点，用于时间范围查询
export function getDayRange(date: Date): DayRange {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
  }
}

// 获取指定月份的天数（month 为 1-12）
export function getDaysInMonth(year: number, month: number): number {
  // Date 的 day 参数传 0 表示上月最后一天，即当月天数
  return new Date(year, month, 0).getDate()
}

/**
 * 获取指定月份第一天的星期偏移量（周一=0, 周日=6）
 * 用于日历网格渲染时计算前置空格数
 */
export function getFirstDayOffset(year: number, month: number): number {
  return (new Date(year, month - 1, 1).getDay() + 6) % 7
}
