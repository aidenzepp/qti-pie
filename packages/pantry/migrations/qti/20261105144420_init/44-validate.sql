-- Validate law __statistic_kind_categorized_in_categorized_jfgum6mp2o: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."categorized_statistic_arm", "qti"."statistic" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_pfwjnfbomb"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'categorized'::"qti"."statistic_kind" THEN
      PERFORM 1 FROM "qti"."categorized_statistic_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __statistic_kind_categorized_in_categorized_jfgum6mp2o violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__statistic_kind_categorized_in_categorized_jfgum6mp2o'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Statistic",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Statistic"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_pfwjnfbomb"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_r6ldks36lx"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'categorized'::"qti"."statistic_kind" THEN
      PERFORM 1 FROM "qti"."categorized_statistic_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __statistic_kind_categorized_in_categorized_jfgum6mp2o violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__statistic_kind_categorized_in_categorized_jfgum6mp2o'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Statistic",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Statistic"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_r6ldks36lx"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_in_categorized_fergs65bek"
  AFTER DELETE ON "qti"."categorized_statistic_arm"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_pfwjnfbomb"();

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_in_categorized_63hxdwy7io"
  AFTER INSERT ON "qti"."statistic"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'categorized'::"qti"."statistic_kind")
  EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_r6ldks36lx"();

-- The full violation query of law __statistic_kind_categorized_in_categorized_jfgum6mp2o.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "id" FROM (SELECT DISTINCT "r4"."c8" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data" FROM "qti"."statistic" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c3" = 'categorized'::"qti"."statistic_kind") AS "r3"("c7")) AS "r4"("c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."id" FROM "qti"."categorized_statistic_arm" AS "r5") AS "r6"("c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c8")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __statistic_kind_categorized_in_categorized_jfgum6mp2o is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__statistic_kind_categorized_in_categorized_jfgum6mp2o'::"pg_catalog"."text";
  END IF;
END
$$;
