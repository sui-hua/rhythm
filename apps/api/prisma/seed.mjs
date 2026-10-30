/**
 * 本地演示数据。
 *
 * 用原生 pg 直接写 SQL，不依赖 tsx / ts-node —— 生成的 Prisma Client 是 TS，
 * 用 node 直接跑会卡在类型擦除上，而 seed 本身只是纯插入，没必要走构建链。
 *
 * 所有主键都是「按 key 生成的确定性 uuid」，配合 ON CONFLICT DO NOTHING，
 * 反复执行不会产生重复数据。
 *
 * 用法：node prisma/seed.mjs
 */
import { createHash } from 'node:crypto'
import { Client } from 'pg'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://root:123456@localhost:5432/rhythm'

/** 与 apps/mobile/.env 的 EXPO_PUBLIC_API_USER_ID 保持一致 */
const DEV_USER_ID = '00000000-0000-4000-8000-000000000001'

/** 由字符串生成稳定的 uuid，保证重复执行命中同一条记录 */
function uid(key) {
  const hex = createHash('md5').update(key).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

/** 构造北京时间的时间戳，避免时区差一天 */
function beijing(dateKey, time = '09:00:00') {
  return `${dateKey}T${time}+08:00`
}

/** 当月 1 号（date 列只存日期） */
function monthStart(today) {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
}

const today = new Date()
const todayKey = toDateKey(today)

const categories = [
  { key: 'study', name: '学习', sort: 1 },
  { key: 'ai', name: 'AI', sort: 2 },
  { key: 'health', name: '健康', sort: 3 },
  { key: 'finance', name: '财务', sort: 4 }
]

/** 目标 + 月度 + 日计划：天数是 [标题, 已完成后缀] */
const goals = [
  {
    key: 'g-design',
    title: '提升设计专业能力',
    description: '界面临摹',
    category: 'study',
    priority: 3,
    lookback: 7,
    months: [
      {
        key: 'y',
        days: [
          ['临摹登录页', true],
          ['临摹个人中心', true],
          ['拆解配色方案', true],
          ['整理组件规范', false],
          ['输出改版方案', false]
        ]
      }
    ]
  },
  {
    key: 'g-run',
    title: '每周运动 3 次',
    description: '跑步 30 分钟',
    category: 'health',
    priority: 2,
    lookback: 3,
    months: [
      {
        key: 'y',
        days: [
          ['慢跑 3 公里', true],
          ['间歇跑 6 组', true],
          ['拉伸放松', false],
          ['长距离 5 公里', false]
        ]
      }
    ]
  },
  {
    key: 'g-ai',
    title: '掌握 AI 工具应用',
    description: '学习 MCP Server',
    category: 'ai',
    priority: 2,
    lookback: 5,
    months: [
      {
        key: 'y',
        days: [
          ['读完 MCP 规范', true],
          ['写一个最小 Server', false],
          ['接入本地工具', false]
        ]
      }
    ]
  },
  {
    key: 'g-save',
    title: '每月储蓄 20% 收入',
    description: '转入储蓄账户',
    category: 'finance',
    priority: 1,
    lookback: 0,
    months: []
  },
  {
    key: 'g-swim',
    title: '学习游泳',
    description: '报名基础班',
    category: 'health',
    priority: 1,
    lookback: 0,
    months: []
  }
]

const habits = [
  { key: 'h-early', title: '早起', frequency: { type: 'daily' }, taskTime: '06:30:00', duration: null, target: 1 },
  { key: 'h-read', title: '阅读', frequency: { type: 'daily' }, taskTime: '21:30:00', duration: 30, target: 30 },
  {
    key: 'h-run',
    title: '跑步',
    frequency: { type: 'weekly', weekdays: [1, 3, 5] },
    taskTime: '07:00:00',
    duration: 40,
    target: 3
  }
]

/** 今天的时间线任务 */
const tasks = [
  { key: 't-1', title: '整理今日待办', start: '09:00:00', end: '09:30:00', completed: true },
  { key: 't-2', title: '项目复盘会', start: '10:00:00', end: '11:00:00', completed: false },
  { key: 't-3', title: '写周报草稿', start: '15:00:00', end: '16:00:00', completed: false }
]

async function main() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    await client.query('BEGIN')

    for (const category of categories) {
      await client.query(
        `INSERT INTO goal_categories (id, user_id, name, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [uid(`category:${category.key}`), DEV_USER_ID, category.name, category.sort]
      )
    }

    for (const goal of goals) {
      const goalId = uid(`goal:${goal.key}`)

      await client.query(
        `INSERT INTO goal (id, user_id, title, description, status, priority, category_id, carry_over_lookback_days, task_time, duration)
         VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, '09:00:00', 30)
         ON CONFLICT (id) DO NOTHING`,
        [
          goalId,
          DEV_USER_ID,
          goal.title,
          goal.description,
          goal.priority,
          uid(`category:${goal.category}`),
          goal.lookback
        ]
      )

      for (const month of goal.months) {
        const monthId = uid(`goal-month:${goal.key}:${month.key}`)

        await client.query(
          `INSERT INTO goal_months (id, goal_id, user_id, title, status, priority, month, task_time, duration)
           VALUES ($1, $2, $3, $4, 'active', 2, $5, '09:00:00', 30)
           ON CONFLICT (id) DO NOTHING`,
          [monthId, goalId, DEV_USER_ID, `${goal.title} · 本月`, monthStart(today)]
        )

        for (const [index, [title, completed]] of month.days.entries()) {
          await client.query(
            `INSERT INTO goal_days (id, goal_month_id, user_id, title, day, status, priority, task_time, duration)
             VALUES ($1, $2, $3, $4, $5, $6, 2, $7, 30)
             ON CONFLICT (id) DO NOTHING`,
            [
              uid(`goal-day:${goal.key}:${month.key}:${index}`),
              monthId,
              DEV_USER_ID,
              title,
              toDateKey(addDays(today, index - 2)),
              completed ? 'completed' : 'active',
              `${String(9 + index).padStart(2, '0')}:00:00`
            ]
          )
        }
      }
    }

    for (const task of tasks) {
      await client.query(
        `INSERT INTO task (id, user_id, title, description, start_time, end_time, completed)
         VALUES ($1, $2, $3, '', $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [
          uid(`task:${task.key}:${todayKey}`),
          DEV_USER_ID,
          task.title,
          beijing(todayKey, task.start),
          beijing(todayKey, task.end),
          task.completed
        ]
      )
    }

    // 收集箱：无时间且未完成
    await client.query(
      `INSERT INTO task (id, user_id, title, description, start_time, end_time, completed)
       VALUES ($1, $2, '整理下周计划', '', NULL, NULL, false)
       ON CONFLICT (id) DO NOTHING`,
      [uid('task:inbox:1'), DEV_USER_ID]
    )

    for (const habit of habits) {
      const habitId = uid(`habit:${habit.key}`)

      await client.query(
        `INSERT INTO habit (id, user_id, title, frequency, target_value, task_time, duration, is_archived)
         VALUES ($1, $2, $3, $4, $5, $6, $7, false)
         ON CONFLICT (id) DO NOTHING`,
        [
          habitId,
          DEV_USER_ID,
          habit.title,
          JSON.stringify(habit.frequency),
          habit.target,
          habit.taskTime,
          habit.duration
        ]
      )

      // 过去 60 天按固定节奏打卡（约 70%），保证热力图与连续天数都有内容
      for (let offset = 0; offset <= 60; offset++) {
        const date = addDays(today, -offset)
        const dateKey = toDateKey(date)

        if (habit.frequency.type === 'weekly' && !habit.frequency.weekdays.includes(date.getDay())) continue
        if ((offset * 7 + habit.key.length) % 10 >= 7) continue

        await client.query(
          `INSERT INTO habit_logs (id, habit_id, user_id, value, log, completed_at)
           VALUES ($1, $2, $3, 1, '', $4)
           ON CONFLICT (id) DO NOTHING`,
          [uid(`habit-log:${habit.key}:${dateKey}`), habitId, DEV_USER_ID, beijing(dateKey, '08:00:00')]
        )
      }
    }

    // 总结：今天 + 昨天 + 上周
    const summaries = [
      {
        key: `summary:daily:${todayKey}`,
        kind: 'daily',
        date: todayKey,
        title: '今天的节奏不错',
        content: {
          done: '上午专注完成复盘，下午把周报草稿写完。',
          improve: '会议前准备可以更充分一些。',
          tomorrow: '先处理最难的那件事。',
          mood: '4'
        }
      },
      {
        key: `summary:daily:${toDateKey(addDays(today, -1))}`,
        kind: 'daily',
        date: toDateKey(addDays(today, -1)),
        title: '节奏有点散',
        content: {
          done: '完成了临摹和跑步。',
          improve: '手机使用时间偏长。',
          tomorrow: '把手机放到另一个房间。',
          mood: '3'
        }
      },
      {
        key: `summary:weekly:${toDateKey(addDays(today, -7))}`,
        kind: 'weekly',
        date: toDateKey(addDays(today, -7)),
        title: '本周回顾',
        content: {
          text: '设计目标推进了 3 天，运动完成 2 次。下周把 AI 目标排进日程。'
        }
      }
    ]

    for (const summary of summaries) {
      await client.query(
        `INSERT INTO summary (id, user_id, kind, period_start, period_end, title, content)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          uid(summary.key),
          DEV_USER_ID,
          summary.kind,
          beijing(summary.date, '00:00:00'),
          beijing(summary.date, '23:59:59'),
          summary.title,
          JSON.stringify(summary.content)
        ]
      )
    }

    await client.query('COMMIT')
    console.log(`✔ 演示数据已写入（user_id = ${DEV_USER_ID}）`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error('✖ 写入失败：', error.message)
  process.exit(1)
})
