-- CreateEnum
CREATE TYPE "habit_repeat_type" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "goal_status" AS ENUM ('active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "summary_period_type" AS ENUM ('daily', 'weekly', 'monthly', 'yearly');

-- CreateTable
CREATE TABLE "sys_user" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sys_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sys_refresh_token" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sys_refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMPTZ,
    "end_time" TIMESTAMPTZ,
    "actual_start_time" TIMESTAMPTZ,
    "actual_end_time" TIMESTAMPTZ,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "repeat_type" "habit_repeat_type" NOT NULL,
    "repeat_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "plan_time" TIME,
    "duration" INTEGER,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_log" (
    "id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" INTEGER,
    "remark" TEXT,

    CONSTRAINT "habit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "year" DATE,
    "start_month" INTEGER NOT NULL,
    "end_month" INTEGER NOT NULL,
    "plan_time" TIME,
    "duration" INTEGER,
    "carry_over_lookback_days" INTEGER NOT NULL,
    "priority" INTEGER DEFAULT 0,
    "status" "goal_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_month" (
    "id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "month" DATE,
    "plan_time" TIME,
    "duration" INTEGER,
    "priority" INTEGER DEFAULT 0,
    "status" "goal_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "goal_month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_day" (
    "id" UUID NOT NULL,
    "goal_month_id" UUID,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "plan_time" TIME,
    "duration" INTEGER,
    "priority" INTEGER DEFAULT 0,
    "status" "goal_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "goal_day_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "summary" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT,
    "period_type" "summary_period_type" NOT NULL,
    "period_start" TIMESTAMPTZ NOT NULL,
    "period_end" TIMESTAMPTZ NOT NULL,
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_report_log" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "report_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_report_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sys_user_email_key" ON "sys_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sys_refresh_token_token_hash_key" ON "sys_refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "sys_refresh_token_user_id_idx" ON "sys_refresh_token"("user_id");

-- CreateIndex
CREATE INDEX "task_user_id_start_time_idx" ON "task"("user_id", "start_time");

-- CreateIndex
CREATE INDEX "task_user_id_completed_idx" ON "task"("user_id", "completed");

-- CreateIndex
CREATE INDEX "task_category_id_idx" ON "task"("category_id");

-- CreateIndex
CREATE INDEX "habit_user_id_archived_idx" ON "habit"("user_id", "archived");

-- CreateIndex
CREATE INDEX "habit_log_habit_id_completed_at_idx" ON "habit_log"("habit_id", "completed_at");

-- CreateIndex
CREATE INDEX "habit_log_user_id_completed_at_idx" ON "habit_log"("user_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "category_user_id_name_key" ON "category"("user_id", "name");

-- CreateIndex
CREATE INDEX "goal_user_id_status_idx" ON "goal"("user_id", "status");

-- CreateIndex
CREATE INDEX "goal_month_goal_id_idx" ON "goal_month"("goal_id");

-- CreateIndex
CREATE INDEX "goal_month_user_id_idx" ON "goal_month"("user_id");

-- CreateIndex
CREATE INDEX "goal_day_user_id_date_idx" ON "goal_day"("user_id", "date");

-- CreateIndex
CREATE INDEX "goal_day_goal_month_id_idx" ON "goal_day"("goal_month_id");

-- CreateIndex
CREATE INDEX "summary_user_id_period_type_period_start_idx" ON "summary"("user_id", "period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "daily_report_log_user_id_report_date_key" ON "daily_report_log"("user_id", "report_date");

-- AddForeignKey
ALTER TABLE "sys_refresh_token" ADD CONSTRAINT "sys_refresh_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit" ADD CONSTRAINT "habit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_log" ADD CONSTRAINT "habit_log_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_log" ADD CONSTRAINT "habit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_month" ADD CONSTRAINT "goal_month_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_month" ADD CONSTRAINT "goal_month_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_day" ADD CONSTRAINT "goal_day_goal_month_id_fkey" FOREIGN KEY ("goal_month_id") REFERENCES "goal_month"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_day" ADD CONSTRAINT "goal_day_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summary" ADD CONSTRAINT "summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_log" ADD CONSTRAINT "daily_report_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "sys_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
