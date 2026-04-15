-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Plans (总计划模块)
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(255),
    category_id UUID,
    year DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
    start_date DATE,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1 Plan Categories (计划分类)
CREATE TABLE plans_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Monthly Plans (月计划模块)
CREATE TABLE monthly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
    month DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Daily Plans (日计划模块)
CREATE TABLE daily_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_plan_id UUID REFERENCES monthly_plans(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
    day DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habits (习惯模块)
-- 4.1 Habits Definition
CREATE TABLE habits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    frequency JSONB NOT NULL DEFAULT '{"type": "daily"}',
    target_value INTEGER DEFAULT 1,
    archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 Habit Logs
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
    log TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tasks (任务模块)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Summaries (总结模块)
-- 6.1 Periodic Summaries
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    scope VARCHAR(50) NOT NULL CHECK (scope IN ('year', 'quarter', 'month', 'week')),
    title TEXT,
    content TEXT,
    mood INTEGER CHECK (mood BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.2 Daily Summaries
CREATE TABLE daily_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    today_did TEXT,
    today_issue TEXT,
    tomorrow_fix TEXT,
    mood INTEGER CHECK (mood BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_plans_user_id ON plans(user_id);
CREATE INDEX idx_plans_category_id ON plans(category_id);
CREATE INDEX idx_plans_category_user_id ON plans_category(user_id);
CREATE INDEX idx_monthly_plans_user_id ON monthly_plans(user_id);
CREATE INDEX idx_monthly_plans_plan_id ON monthly_plans(plan_id);
CREATE INDEX idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX idx_monthly_plans_user_id ON monthly_plans(user_id);
CREATE INDEX idx_monthly_plans_plan_id ON monthly_plans(plan_id);
CREATE INDEX idx_daily_plans_user_id ON daily_plans(user_id);
CREATE INDEX idx_daily_plans_monthly_plan_id ON daily_plans(monthly_plan_id);
CREATE INDEX idx_daily_plans_day ON daily_plans(day);
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_start_time ON tasks(start_time);
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE INDEX idx_daily_summaries_user_id ON daily_summaries(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming authenticated users can only access their own data)
-- Note: 'auth.uid()' is a Supabase specific function.

-- Plans Policies
CREATE POLICY "Users can view their own plans" ON plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plans" ON plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans" ON plans FOR DELETE USING (auth.uid() = user_id);

-- Plan Categories Policies
CREATE POLICY "Users can view their own plan categories" ON plans_category FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own plan categories" ON plans_category FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plan categories" ON plans_category FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plan categories" ON plans_category FOR DELETE USING (auth.uid() = user_id);

-- Monthly Plans Policies
CREATE POLICY "Users can view their own monthly plans" ON monthly_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own monthly plans" ON monthly_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monthly plans" ON monthly_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monthly plans" ON monthly_plans FOR DELETE USING (auth.uid() = user_id);

-- Daily Plans Policies
CREATE POLICY "Users can view their own daily plans" ON daily_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily plans" ON daily_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily plans" ON daily_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily plans" ON daily_plans FOR DELETE USING (auth.uid() = user_id);

-- Habits Policies
CREATE POLICY "Users can view their own habits" ON habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- Habit Logs Policies (Access via habit_id -> user_id check is more complex in RLS sometimes, 
-- but usually we also store user_id on logs or join. 
-- Here we don't have user_id on logs, so we must check via habits table or trust the application to pass correct IDs.
-- However, standard practice is to join. But for simplicity in this generated script, 
-- and since many Supabase setups recommend denormalizing user_id to child tables for easier RLS, 
-- I will assume we might want to add user_id to habit_logs or use a subquery.)

-- Let's add user_id to habit_logs for easier RLS as is best practice in Supabase
ALTER TABLE habit_logs ADD COLUMN user_id UUID REFERENCES auth.users(id); 
-- (Wait, standard SQL doesn't have auth.users available always, but in Supabase context it does. 
-- For now, let's stick to the design doc which didn't have user_id on habit_logs.
-- Using subquery for RLS on habit_logs:)
CREATE POLICY "Users can view their own habit logs" ON habit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own habit logs" ON habit_logs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);
CREATE POLICY "Users can update their own habit logs" ON habit_logs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own habit logs" ON habit_logs FOR DELETE USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_logs.habit_id AND habits.user_id = auth.uid())
);

-- Tasks Policies
CREATE POLICY "Users can view their own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Summaries Policies
CREATE POLICY "Users can view their own summaries" ON summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own summaries" ON summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own summaries" ON summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own summaries" ON summaries FOR DELETE USING (auth.uid() = user_id);

-- Daily Summaries Policies
CREATE POLICY "Users can view their own daily summaries" ON daily_summaries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily summaries" ON daily_summaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily summaries" ON daily_summaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own daily summaries" ON daily_summaries FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Direction Data Constraints & RPC (added for N+1 optimization)
-- ============================================================

-- Step 1: Add unique constraint on daily_plans(monthly_plan_id, day)
ALTER TABLE daily_plans
ADD CONSTRAINT uq_daily_plans_monthly_day UNIQUE (monthly_plan_id, day);

-- Step 2: Change FK to CASCADE delete (drop auto-named FK, recreate with CASCADE)
-- The inline REFERENCES creates an auto-named FK: daily_plans_monthly_plan_id_fkey
ALTER TABLE daily_plans
DROP CONSTRAINT IF EXISTS daily_plans_monthly_plan_id_fkey;

ALTER TABLE daily_plans
ADD CONSTRAINT daily_plans_monthly_plan_id_fkey
FOREIGN KEY (monthly_plan_id)
REFERENCES monthly_plans(id)
ON DELETE CASCADE;

-- Step 3: Batch upsert / delete RPC functions
CREATE OR REPLACE FUNCTION batch_upsert_daily_plans(
  p_monthly_plan_id UUID,
  p_user_id UUID,
  p_items JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_plans (monthly_plan_id, user_id, day, title, task_time, duration)
  SELECT
    p_monthly_plan_id,
    p_user_id,
    (item->>'date')::DATE,
    item->>'title',
    NULLIF(item->>'task_time', ''),
    NULLIF(item->>'duration', '')::INT
  FROM jsonb_array_elements(p_items) AS item
  ON CONFLICT (monthly_plan_id, day)
  DO UPDATE SET
    title = EXCLUDED.title,
    task_time = EXCLUDED.task_time,
    duration = EXCLUDED.duration,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION batch_delete_daily_plans(
  p_monthly_plan_id UUID,
  p_days INT[]
) RETURNS VOID AS $$
BEGIN
  DELETE FROM daily_plans
  WHERE monthly_plan_id = p_monthly_plan_id
    AND EXTRACT(DAY FROM day)::INT = ANY(p_days);
END;
$$ LANGUAGE plpgsql;
