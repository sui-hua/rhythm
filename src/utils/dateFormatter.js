/**
 * 将月份数字转换为对应的中英文本
 * @param {number|string} monthNumber 1-12 的月份数字（注意不是 0-indexed）
 * @param {'zh'|'en'|'full'} format 'zh': 一月, 'en': JANUARY, 'full': 一月 (January)
 * @returns {string} 
 */
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
        case 'zh':
        default:
            return zh[idx];
    }
}
