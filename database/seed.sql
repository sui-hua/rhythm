-- Seed data for Rhythm App
-- Usage: Replace 'YOUR_USER_ID_HERE' with your actual Supabase User UUID before running.

-- Clean up existing data (optional, be careful!)
-- TRUNCATE TABLE daily_summaries, summaries, tasks, habit_logs, habits, daily_plans, monthly_plans, plans CASCADE;

DO $$
DECLARE
    -- Replace this with your actual User ID from auth.users
    -- You can find it in Supabase Dashboard -> Authentication -> Users
    target_user_id UUID := '00000000-0000-0000-0000-000000000000'; 
    
    -- Variables for IDs
    v_plan_tech_id UUID;
    v_plan_life_id UUID;
    v_mp_feb_id UUID;
    v_habit_read_id UUID;
    v_habit_code_id UUID;
BEGIN
    -- ---------------------------------------------------------
    -- 1. Plans (总计划)
    -- ---------------------------------------------------------
    
    -- Plan 1: Technology
    INSERT INTO plans (user_id, title, description, category, year, status, priority)
    VALUES (target_user_id, '全栈架构师进阶', '精通 Vue 3 生态与 Supabase 后端集成，构建高性能应用', '职业发展', '2026-01-01', 'active', 3)
    RETURNING id INTO v_plan_tech_id;

    -- Plan 2: Life/Health
    INSERT INTO plans (user_id, title, description, category, year, status, priority)
    VALUES (target_user_id, '健康生活 2026', '改善睡眠，规律运动，保持精力充沛', '健康', '2026-01-01', 'active', 2)
    RETURNING id INTO v_plan_life_id;

    -- ---------------------------------------------------------
    -- 2. Monthly Plans (月计划)
    -- ---------------------------------------------------------
    
    -- Monthly Plan for Feb: Backend Focus
    INSERT INTO monthly_plans (plan_id, user_id, title, description, status, priority, month)
    VALUES (v_plan_tech_id, target_user_id, '二月：数据库与后端攻坚', '完成 Rhythm 项目的数据库设计、API 封装及权限系统', 'active', 3, '2026-02-01')
    RETURNING id INTO v_mp_feb_id;

    -- ---------------------------------------------------------
    -- 3. Daily Plans (日计划)
    -- ---------------------------------------------------------
    
    INSERT INTO daily_plans (monthly_plan_id, user_id, title, description, status, priority, day)
    VALUES
    (v_mp_feb_id, target_user_id, '完成数据库 Schema 设计', '设计包含 Plans, Habits, Tasks 的核心表结构', 1, 3, '2026-02-09'),
    (v_mp_feb_id, target_user_id, '集成 Supabase Client', '封装 database.js 服务层', 0, 3, '2026-02-10');

    -- ---------------------------------------------------------
    -- 4. Habits (习惯)
    -- ---------------------------------------------------------
    
    -- Habit 1: Reading
    INSERT INTO habits (user_id, title, frequency, target_value, archived)
    VALUES (target_user_id, '技术阅读', '{"type": "daily"}', 30, false) -- 30 mins
    RETURNING id INTO v_habit_read_id;

    -- Habit 2: Coding Streak
    INSERT INTO habits (user_id, title, frequency, target_value, archived)
    VALUES (target_user_id, 'GitHub Commit', '{"type": "daily"}', 1, false)
    RETURNING id INTO v_habit_code_id;

    -- Habit Logs (use `log` text field)
    INSERT INTO habit_logs (habit_id, log, completed_at)
    VALUES 
    (v_habit_read_id, '30 minutes reading', '2026-02-08 22:00:00+00'),
    (v_habit_read_id, '45 minutes reading', '2026-02-09 21:30:00+00'),
    (v_habit_code_id, '3 commits', '2026-02-09 10:00:00+00');

    -- ---------------------------------------------------------
    -- 5. Tasks (任务) - Timeline Data
    -- ---------------------------------------------------------
    
    INSERT INTO tasks (user_id, title, description, start_time, end_time, completed)
    VALUES 
    -- Morning Deep Work
    (target_user_id, '数据库架构设计', '绘制 ER 图，确定表关联关系', '2026-02-09 09:00:00+00', '2026-02-09 11:00:00+00', true),
    
    -- Afternoon Dev
    (target_user_id, 'SQL 脚本编写', '编写 schema.sql 和 seed.sql', '2026-02-09 14:00:00+00', '2026-02-09 15:30:00+00', true),
    
    -- Meeting
    (target_user_id, '项目进度同步会', '与前端团队对齐 API 接口', '2026-02-09 16:00:00+00', '2026-02-09 17:00:00+00', false),
    
    -- Evening
    (target_user_id, '夜跑 5KM', '保持体能', '2026-02-09 19:00:00+00', '2026-02-09 20:00:00+00', false);

    -- ---------------------------------------------------------
    -- 6. Summaries (总结)
    -- ---------------------------------------------------------
    
    -- Daily Summary
    INSERT INTO daily_summaries (user_id, today_did, today_issue, tomorrow_fix, mood, created_at)
    VALUES (target_user_id, '完成了核心数据库设计，进度符合预期。', '下午注意力有点分散，咖啡喝多了。', '明天尝试番茄工作法，减少干扰。', 4, '2026-02-09 23:00:00+00');

END $$;
