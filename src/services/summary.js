import { mockDb } from './mockDb'

class SummaryService {
    // 模拟网络延迟
    async _delay() {
        await new Promise(resolve => setTimeout(resolve, 300))
    }

    async getSummaries(type, dateRange) {
        await this._delay()

        let filtered = mockDb.summaries.value.filter(s => s.level === type)

        if (dateRange) {
            const { start, end } = dateRange
            filtered = filtered.filter(s => {
                const date = new Date(s.created_at).toISOString().split('T')[0]
                return date >= start && date <= end
            })
        }

        // 按日期倒序排列
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

        // Transform for UI (if needed, but for now we'll keep it consistent with DB schema)
        return { data: filtered, error: null }
    }

    async createSummary(summaryData) {
        await this._delay()

        const newSummary = {
            id: crypto.randomUUID(),
            user_id: 'user-123',
            level: summaryData.type || 'day',
            content: typeof summaryData.content === 'object' ? JSON.stringify(summaryData.content) : summaryData.content,
            source: 'user',
            created_at: summaryData.date || new Date().toISOString()
        }

        mockDb.summaries.value.push(newSummary)

        return { data: newSummary, error: null }
    }

    async updateSummary(id, summaryData) {
        await this._delay()

        const index = mockDb.summaries.value.findIndex(s => s.id === id)
        if (index === -1) {
            return { data: null, error: 'Summary not found' }
        }

        const updatedSummary = {
            ...mockDb.summaries.value[index],
            content: typeof summaryData.content === 'object' ? JSON.stringify(summaryData.content) : summaryData.content,
            level: summaryData.type || mockDb.summaries.value[index].level
        }

        mockDb.summaries.value[index] = updatedSummary

        return { data: updatedSummary, error: null }
    }

    async deleteSummary(id) {
        await this._delay()

        const index = mockDb.summaries.value.findIndex(s => s.id === id)
        if (index === -1) {
            return { data: null, error: 'Summary not found' }
        }

        mockDb.summaries.value.splice(index, 1)

        return { data: true, error: null }
    }
}

export default new SummaryService()
