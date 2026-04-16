-- unify daily_plans date/day to single day column

-- 0) only-date environment: rename date -> day
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'date'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'day'
  ) THEN
    ALTER TABLE public.daily_plans RENAME COLUMN date TO day;
  END IF;
END $$;

-- 1) date+day coexist: backfill day from date
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'date'
  )
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_plans' AND column_name = 'day'
  ) THEN
    EXECUTE '
      UPDATE public.daily_plans
      SET day = date
      WHERE day IS NULL
        AND date IS NOT NULL
    ';
  END IF;
END $$;

-- 2) enforce final shape
ALTER TABLE public.daily_plans
ALTER COLUMN day SET NOT NULL;

ALTER TABLE public.daily_plans
DROP COLUMN IF EXISTS date;

-- 3) converge indexes
DROP INDEX IF EXISTS public.idx_daily_plans_date;
CREATE INDEX IF NOT EXISTS idx_daily_plans_day ON public.daily_plans(day);

-- 4) safety check
SELECT COUNT(*) AS null_day_count
FROM public.daily_plans
WHERE day IS NULL;
