-- Migration to remove year from monthly_plans and rename date to day in daily_plans

-- 1. Remove year from monthly_plans if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'monthly_plans' AND column_name = 'year') THEN
        ALTER TABLE monthly_plans DROP COLUMN year;
    END IF;
END $$;

-- 2. Rename date to day in daily_plans
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_plans' AND column_name = 'date') THEN
        ALTER TABLE daily_plans RENAME COLUMN date TO day;
    END IF;
END $$;
