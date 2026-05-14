export const getMonthName = (monthNumber, format = 'zh') => {
    const num = parseInt(monthNumber, 10);
    if (isNaN(num) || num < 1 || num > 12) return '';

    const zh = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const en = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const full = ['一月 (January)', '二月 (February)', '三月 (March)', '四月 (April)', '五月 (May)', '六月 (June)', '七月 (July)', '八月 (August)', '九月 (September)', '十月 (October)', '十一月 (November)', '十二月 (December)'];

    const idx = num - 1;
    switch (format) {
        case 'en': return en[idx];
        case 'full': return full[idx];
        default: return zh[idx];
    }
}

export function toDateOnly(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

export function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate()
}

export function getDayRange(date) {
    return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    }
}

export function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate()
}

export function getFirstDayOffset(year, month) {
    return (new Date(year, month - 1, 1).getDay() + 6) % 7
}
