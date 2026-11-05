-- Validate law __equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."equal", "qti"."equal_tolerance" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_equal_tolerance_mode_absolute_in_equal_pv6zogrlhb"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."equal_tolerance" AS "r1" WHERE "r1"."node" = NEW."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."equal" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."tolerance_mode" = 'absolute'::"qti"."tolerance_mode" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Equal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Equal"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_equal_tolerance_mode_absolute_in_equal_pv6zogrlhb"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_equal_tolerance_mode_absolute_in_equal_jhzqyzrfuo"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."equal_tolerance" AS "r1" WHERE "r1"."node" = OLD."node";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."equal" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."tolerance_mode" = 'absolute'::"qti"."tolerance_mode" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Equal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Equal"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_equal_tolerance_mode_absolute_in_equal_jhzqyzrfuo"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_equal_tolerance_mode_absolute_in_equal_dggpeh7npk"
  AFTER INSERT ON "qti"."equal"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."tolerance_mode" = 'absolute'::"qti"."tolerance_mode")
  EXECUTE FUNCTION "qti"."__law_equal_tolerance_mode_absolute_in_equal_pv6zogrlhb"();

CREATE CONSTRAINT TRIGGER "__law_equal_tolerance_mode_absolute_in_equal_43wf6fnaqe"
  AFTER DELETE ON "qti"."equal_tolerance"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_equal_tolerance_mode_absolute_in_equal_jhzqyzrfuo"();

-- The full violation query of law __equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "id" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."include_lower_bound", "r1"."include_upper_bound", "r1"."tolerance_mode" FROM "qti"."equal" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'absolute'::"qti"."tolerance_mode") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."node", "r5"."tolerance_mode", "r5"."value" FROM "qti"."equal_tolerance" AS "r5") AS "r6"("c7", "c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c6")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__equal_tolerance_mode_absolute_in_equal_tolerance_5o5gxcrhgm'::"pg_catalog"."text";
  END IF;
END
$$;
