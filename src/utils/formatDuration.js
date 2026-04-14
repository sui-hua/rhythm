/**
 * 将小时数转换为中文自然语言格式
 * @param {number} hours - 小时数，支持小数
 * @returns {string} 中文格式，如 "30分钟"、"1小时"、"3小时30分钟"
 */
export function formatDuration(hours) {
    if (!hours || hours <= 0) {
        return '0分钟'
    }

    const totalMinutes = Math.round(hours * 60)

    if (totalMinutes < 60) {
        return `${totalMinutes}分钟`
    }

    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60

    if (m === 0) {
        return `${h}小时`
    }

    return `${h}小时${m}分钟`
}

/**
 * 将分钟数转换为中文自然语言格式
 * @param {number} minutes - 分钟数
 * @returns {string} 中文格式
 */
export function formatMinutes(minutes) {
    return formatDuration(minutes / 60)
}
