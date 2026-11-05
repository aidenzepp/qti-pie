-- Validate law __section_duration_ref_root_test_in_section_duration_zqsxhox2db: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."section_duration_ref", "qti"."section_duration_target" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_4jeyzgkbal"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."section_duration_target" AS "r1" WHERE "r1"."ref" = NEW."id" AND "r1"."test" = NEW."document";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."section_duration_ref" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."document" = NEW."document" AND "r1"."root" = 'test'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __section_duration_ref_root_test_in_section_duration_zqsxhox2db violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__section_duration_ref_root_test_in_section_duration_zqsxhox2db'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionDurationRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionDurationRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_4jeyzgkbal"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_w4zmtgadq3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."section_duration_target" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."section_duration_ref" AS "r1" WHERE "r1"."id" = OLD."ref" AND "r1"."document" = OLD."test" AND "r1"."root" = 'test'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __section_duration_ref_root_test_in_section_duration_zqsxhox2db violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__section_duration_ref_root_test_in_section_duration_zqsxhox2db'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionDurationRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionDurationRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_w4zmtgadq3"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_section_duration_ref_root_test_in_section_ntx333wqcw"
  AFTER INSERT ON "qti"."section_duration_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'test'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_4jeyzgkbal"();

CREATE CONSTRAINT TRIGGER "__law_section_duration_ref_root_test_in_section_4xxuotlte7"
  AFTER DELETE ON "qti"."section_duration_target"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_section_duration_ref_root_test_in_section_w4zmtgadq3"();

-- The full violation query of law __section_duration_ref_root_test_in_section_duration_zqsxhox2db.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c20" AS "id", "r9"."c21" AS "document" FROM (SELECT DISTINCT "r4"."c7", "r4"."c8" FROM (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c2", "r2"."c1" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."prefix", "r1"."root" FROM "qti"."section_duration_ref" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'test'::"qti"."root_kind") AS "r3"("c5", "c6")) AS "r4"("c7", "c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c13", "r6"."c15" FROM (SELECT DISTINCT "r5"."document", "r5"."holder", "r5"."holder_kind", "r5"."prefix", "r5"."ref", "r5"."ref_kind", "r5"."test" FROM "qti"."section_duration_target" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13", "c14", "c15")) AS "r7"("c16", "c17")) AS "r8"("c18", "c19") WHERE "r8"."c18" = "r4"."c7" AND "r8"."c19" = "r4"."c8")) AS "r9"("c20", "c21")) THEN
    RAISE EXCEPTION 'law __section_duration_ref_root_test_in_section_duration_zqsxhox2db is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__section_duration_ref_root_test_in_section_duration_zqsxhox2db'::"pg_catalog"."text";
  END IF;
END
$$;
