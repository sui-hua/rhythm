-- Remove start_date and end_date from monthly_plans
ALTER TABLE monthly_plans DROP COLUMN IF EXISTS start_date;
ALTER TABLE monthly_plans DROP COLUMN IF EXISTS end_date;
