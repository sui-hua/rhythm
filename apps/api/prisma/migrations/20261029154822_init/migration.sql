-- CreateTable
CREATE TABLE "daily_report_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "report_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_report_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'active',
    "priority" INTEGER DEFAULT 2,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "year" DATE,
    "category_id" UUID,
    "task_time" TIME(6),
    "duration" INTEGER DEFAULT 30,
    "carry_over_lookback_days" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "plans_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_days" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_month_id" UUID,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER DEFAULT 2,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "day" DATE NOT NULL,
    "task_time" TIME(6),
    "duration" INTEGER DEFAULT 30,
    "status" VARCHAR DEFAULT 'active',

    CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_months" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) DEFAULT 'active',
    "priority" INTEGER DEFAULT 2,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "month" DATE,
    "task_time" TIME(6),
    "duration" INTEGER DEFAULT 30,

    CONSTRAINT "monthly_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "frequency" JSONB NOT NULL DEFAULT '{"type": "daily"}',
    "target_value" INTEGER DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "task_time" TIME(6),
    "duration" INTEGER DEFAULT 10,
    "is_archived" BOOLEAN DEFAULT false,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID,
    "value" INTEGER DEFAULT 1,
    "completed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "log" TEXT,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "summary" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "content" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT,
    "period_start" TIMESTAMPTZ(6),
    "period_end" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMPTZ(6),
    "end_time" TIMESTAMPTZ(6),
    "completed" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "actual_start_time" TIMESTAMPTZ(6),
    "actual_end_time" TIMESTAMPTZ(6),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_report_views_user_date_unique" ON "daily_report_log"("user_id", "report_date");

-- CreateIndex
CREATE INDEX "idx_plans_category_id" ON "goal"("category_id");

-- CreateIndex
CREATE INDEX "idx_plans_user_id" ON "goal"("user_id");

-- CreateIndex
CREATE INDEX "idx_plans_category_user_id" ON "goal_categories"("user_id");

-- CreateIndex
CREATE INDEX "idx_plans_category_user_sort_order" ON "goal_categories"("user_id", "sort_order");

-- CreateIndex
CREATE INDEX "idx_daily_plans_day" ON "goal_days"("day");

-- CreateIndex
CREATE INDEX "idx_daily_plans_monthly_plan_id" ON "goal_days"("goal_month_id");

-- CreateIndex
CREATE INDEX "idx_daily_plans_user_id" ON "goal_days"("user_id");

-- CreateIndex
CREATE INDEX "idx_goal_days_user_day" ON "goal_days"("user_id", "day");

-- CreateIndex
CREATE INDEX "idx_monthly_plans_plan_id" ON "goal_months"("goal_id");

-- CreateIndex
CREATE INDEX "idx_monthly_plans_user_id" ON "goal_months"("user_id");

-- CreateIndex
CREATE INDEX "idx_habits_user_id" ON "habit"("user_id");

-- CreateIndex
CREATE INDEX "idx_habit_logs_completed" ON "habit_logs"("habit_id", "completed_at");

-- CreateIndex
CREATE INDEX "idx_habit_logs_habit_id" ON "habit_logs"("habit_id");

-- CreateIndex
CREATE INDEX "idx_summaries_user_id" ON "summary"("user_id");

-- CreateIndex
CREATE INDEX "asks_time_index" ON "task"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "idx_task_user_start" ON "task"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "idx_tasks_user_id" ON "task"("user_id");

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "plans_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "goal_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goal_days" ADD CONSTRAINT "daily_plans_monthly_plan_id_fkey" FOREIGN KEY ("goal_month_id") REFERENCES "goal_months"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "goal_months" ADD CONSTRAINT "monthly_plans_plan_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goal"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
