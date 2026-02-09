


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."daily_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "monthly_plan_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" character varying(50) DEFAULT 'active'::character varying,
    "priority" integer DEFAULT 2,
    "date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "day" "date",
    CONSTRAINT "daily_plans_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 3))),
    CONSTRAINT "daily_plans_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."daily_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."daily_summaries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "today_did" "text",
    "today_issue" "text",
    "tomorrow_fix" "text",
    "mood" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "daily_summaries_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5)))
);


ALTER TABLE "public"."daily_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "habit_id" "uuid",
    "value" integer DEFAULT 1,
    "completed_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "log" "text"
);


ALTER TABLE "public"."habit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."habits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "frequency" "jsonb" DEFAULT '{"type": "daily"}'::"jsonb" NOT NULL,
    "target_value" integer DEFAULT 1,
    "archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."habits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monthly_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "plan_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" character varying(50) DEFAULT 'active'::character varying,
    "priority" integer DEFAULT 2,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "month" "date",
    CONSTRAINT "monthly_plans_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 3))),
    CONSTRAINT "monthly_plans_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."monthly_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" character varying(255),
    "status" character varying(50) DEFAULT 'active'::character varying,
    "priority" integer DEFAULT 2,
    "start_date" "date",
    "target_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "year" "date",
    CONSTRAINT "plans_priority_check" CHECK ((("priority" >= 1) AND ("priority" <= 3))),
    CONSTRAINT "plans_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'archived'::character varying])::"text"[])))
);


ALTER TABLE "public"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."summaries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "scope" character varying(50) NOT NULL,
    "title" "text",
    "content" "text",
    "mood" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "summaries_mood_check" CHECK ((("mood" >= 1) AND ("mood" <= 5))),
    CONSTRAINT "summaries_scope_check" CHECK ((("scope")::"text" = ANY ((ARRAY['year'::character varying, 'quarter'::character varying, 'month'::character varying, 'week'::character varying])::"text"[])))
);


ALTER TABLE "public"."summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone,
    "end_time" timestamp with time zone,
    "completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."daily_plans"
    ADD CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_summaries"
    ADD CONSTRAINT "daily_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."habits"
    ADD CONSTRAINT "habits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monthly_plans"
    ADD CONSTRAINT "monthly_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."summaries"
    ADD CONSTRAINT "summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_daily_plans_date" ON "public"."daily_plans" USING "btree" ("date");



CREATE INDEX "idx_daily_plans_monthly_plan_id" ON "public"."daily_plans" USING "btree" ("monthly_plan_id");



CREATE INDEX "idx_daily_plans_user_id" ON "public"."daily_plans" USING "btree" ("user_id");



CREATE INDEX "idx_daily_summaries_user_id" ON "public"."daily_summaries" USING "btree" ("user_id");



CREATE INDEX "idx_habit_logs_habit_id" ON "public"."habit_logs" USING "btree" ("habit_id");



CREATE INDEX "idx_habits_user_id" ON "public"."habits" USING "btree" ("user_id");



CREATE INDEX "idx_monthly_plans_plan_id" ON "public"."monthly_plans" USING "btree" ("plan_id");



CREATE INDEX "idx_monthly_plans_user_id" ON "public"."monthly_plans" USING "btree" ("user_id");



CREATE INDEX "idx_plans_user_id" ON "public"."plans" USING "btree" ("user_id");



CREATE INDEX "idx_summaries_user_id" ON "public"."summaries" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_start_time" ON "public"."tasks" USING "btree" ("start_time");



CREATE INDEX "idx_tasks_user_id" ON "public"."tasks" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."daily_plans"
    ADD CONSTRAINT "daily_plans_monthly_plan_id_fkey" FOREIGN KEY ("monthly_plan_id") REFERENCES "public"."monthly_plans"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."habit_logs"
    ADD CONSTRAINT "habit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."monthly_plans"
    ADD CONSTRAINT "monthly_plans_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE CASCADE;



CREATE POLICY "Users can delete their own daily plans" ON "public"."daily_plans" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own daily summaries" ON "public"."daily_summaries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own habit logs" ON "public"."habit_logs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own habits" ON "public"."habits" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own monthly plans" ON "public"."monthly_plans" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own plans" ON "public"."plans" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own summaries" ON "public"."summaries" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own tasks" ON "public"."tasks" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own daily plans" ON "public"."daily_plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own daily summaries" ON "public"."daily_summaries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own habit logs" ON "public"."habit_logs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert their own habits" ON "public"."habits" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own monthly plans" ON "public"."monthly_plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own plans" ON "public"."plans" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own summaries" ON "public"."summaries" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own tasks" ON "public"."tasks" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own daily plans" ON "public"."daily_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own daily summaries" ON "public"."daily_summaries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own habit logs" ON "public"."habit_logs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own habits" ON "public"."habits" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own monthly plans" ON "public"."monthly_plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own plans" ON "public"."plans" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own summaries" ON "public"."summaries" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own tasks" ON "public"."tasks" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own daily plans" ON "public"."daily_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own daily summaries" ON "public"."daily_summaries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own habit logs" ON "public"."habit_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."habits"
  WHERE (("habits"."id" = "habit_logs"."habit_id") AND ("habits"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own habits" ON "public"."habits" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own monthly plans" ON "public"."monthly_plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own plans" ON "public"."plans" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own summaries" ON "public"."summaries" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own tasks" ON "public"."tasks" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."daily_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monthly_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."summaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON TABLE "public"."daily_plans" TO "anon";
GRANT ALL ON TABLE "public"."daily_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_plans" TO "service_role";



GRANT ALL ON TABLE "public"."daily_summaries" TO "anon";
GRANT ALL ON TABLE "public"."daily_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."habit_logs" TO "anon";
GRANT ALL ON TABLE "public"."habit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."habit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."habits" TO "anon";
GRANT ALL ON TABLE "public"."habits" TO "authenticated";
GRANT ALL ON TABLE "public"."habits" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_plans" TO "anon";
GRANT ALL ON TABLE "public"."monthly_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_plans" TO "service_role";



GRANT ALL ON TABLE "public"."plans" TO "anon";
GRANT ALL ON TABLE "public"."plans" TO "authenticated";
GRANT ALL ON TABLE "public"."plans" TO "service_role";



GRANT ALL ON TABLE "public"."summaries" TO "anon";
GRANT ALL ON TABLE "public"."summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."summaries" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







