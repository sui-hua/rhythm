import { ref } from 'vue'

// Helpers
const now = new Date()
const today = now.toISOString().split('T')[0] // YYYY-MM-DD

// 1. Plans (总计划)
const plans = ref([
    {
        id: 'p1',
        title: '战略核心',
        description: '构建公司的核心竞争力和品牌护城河',
        category: 'Strategic',
        status: 'active',
        priority: 3,
        start_date: '2026-01-01',
        target_date: '2026-12-31'
    },
    {
        id: 'p2',
        title: '增长与情报',
        description: '通过数据分析和市场情报驱动业务增长',
        category: 'Growth',
        status: 'active',
        priority: 2,
        start_date: '2026-01-01',
        target_date: '2026-12-31'
    },
    {
        id: 'p3',
        title: '身心健康',
        description: '保持高水平的体能和精神状态',
        category: 'Health',
        status: 'active',
        priority: 3,
        start_date: '2026-01-01',
        target_date: '2026-12-31'
    }
])

// 2. Monthly Plans (月计划)
const monthlyPlans = ref([
    {
        id: 'mp1',
        plan_id: 'p1',
        title: '品牌形象设计',
        description: '完成全套VI设计和官网改版',
        status: 'active',
        priority: 3,
        start_date: '2026-03-01',
        end_date: '2026-08-31',
        start_month: 3,
        end_month: 8
    },
    {
        id: 'mp2',
        plan_id: 'p1',
        title: '核心引擎 V3',
        description: '发布核心引擎第三版，提升性能',
        status: 'active',
        priority: 3,
        start_date: '2026-01-01',
        end_date: '2026-04-30',
        start_month: 1,
        end_month: 4
    },
    {
        id: 'mp3',
        plan_id: 'p2',
        title: '市场情报分析',
        description: '建立竞品监控体系',
        status: 'active',
        priority: 2,
        start_date: '2026-07-01',
        end_date: '2026-12-31',
        start_month: 7,
        end_month: 12
    },
    {
        id: 'mp4',
        plan_id: 'p3',
        title: '马拉松训练',
        description: '备战秋季马拉松',
        status: 'active',
        priority: 2,
        start_date: '2026-05-01',
        end_date: '2026-10-31',
        start_month: 5,
        end_month: 10
    }
])

// 3. Habits (习惯)
const habits = ref([
    {
        id: 'h1',
        title: '每日冥想',
        frequency: { type: 'daily' },
        target_value: 1,
        archived: false,
        monthCount: 12,
        total: 145,
        completionRate: 72,
        streak: 5,
        completedDays: [2, 5, 8, 9, 12, 14, 15, 16, 19, 21, 23, 26]
    },
    {
        id: 'h2',
        title: '深度工作',
        frequency: { type: 'daily' },
        target_value: 4,
        archived: false,
        monthCount: 18,
        total: 198,
        completionRate: 90,
        streak: 15,
        completedDays: [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26]
    },
    {
        id: 'h3',
        title: '英文阅读',
        frequency: { type: 'daily' },
        target_value: 1,
        archived: false,
        monthCount: 22,
        total: 310,
        completionRate: 85,
        streak: 30,
        completedDays: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 26]
    }
])

// 4. Tasks (任务 - simulating Daily Schedule)
const tasks = ref([
    {
        id: 't1',
        title: '晨间阅读',
        description: '阅读《原则》30分钟',
        start_time: '08:00',
        end_time: '08:30',
        date: '2026-01-25',
        completed: true,
        priority: 2
    },
    {
        id: 't2',
        title: 'Deep Work',
        description: '核心功能开发 - 设计并实现 MockDB',
        start_time: '09:00',
        end_time: '12:00',
        date: '2026-01-25',
        completed: true,
        priority: 3
    },
    {
        id: 't3',
        title: '团队午餐',
        description: '交流近期项目灵感',
        start_time: '12:00',
        end_time: '13:00',
        date: '2026-01-25',
        completed: true,
        priority: 1
    },
    {
        id: 't4',
        title: '系统审计与优化',
        description: '优化渲染管线，确保在视图层之间实现120fps的流体过渡',
        start_time: '14:00',
        end_time: '16:30',
        date: '2026-01-26',
        completed: false,
        priority: 3
    },
    {
        id: 't5',
        title: '邮件回顾',
        description: '处理关键客户咨询',
        start_time: '16:30',
        end_time: '17:30',
        date: '2026-01-26',
        completed: false,
        priority: 2
    },
    {
        id: 't6',
        title: '健身锻炼',
        description: '专注于核心力量训练',
        start_time: '18:30',
        end_time: '20:00',
        date: '2026-01-26',
        completed: false,
        priority: 1
    }
])

// 5. Summaries (总结)
const summaries = ref([
    {
        id: 's1',
        level: 'day',
        content: JSON.stringify({
            done: '完成了全局 MockDB 的搭建，统一了所有页面的数据源。',
            improve: '在组件重构上花费了比预期更多的时间。',
            tomorrow: '开始进行 Supabase 的实际对接。'
        }),
        source: 'user',
        created_at: new Date(now.getTime() - 86400000).toISOString() // Yesterday
    },
    {
        id: 's2',
        level: 'day',
        content: JSON.stringify({
            done: '今日完成了习惯页面和所向页面的样式重构。',
            improve: '对 Tailwind 类的复用程度还可以进一步提高。',
            tomorrow: '实现侧边栏的可伸缩功能。'
        }),
        source: 'user',
        created_at: new Date(now.getTime() - 172800000).toISOString() // 2 days ago
    },
    {
        id: 's3',
        level: 'week',
        content: '本周主要进展在前端 UI 的极简风格统一和响应式侧边栏的实现。',
        source: 'user',
        created_at: new Date(now.getTime() - 432000000).toISOString() // 5 days ago
    }
])

export const mockDb = {
    plans,
    monthlyPlans,
    habits,
    tasks,
    summaries
}
