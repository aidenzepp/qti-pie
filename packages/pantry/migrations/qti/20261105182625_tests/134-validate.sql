-- Validate law __test_identifier_holder_kind_part_in_test_part_muzziyfgsl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."test_identifier", "qti"."test_part" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_lzm5dhjavd"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."test_part" AS "r1" WHERE "r1"."id" = NEW."holder";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."holder" AS "c1" FROM "qti"."test_identifier" AS "r1" WHERE "r1"."holder" = NEW."holder" AND "r1"."holder_kind" = 'part'::"qti"."structure_holder" ORDER BY "r1"."holder" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __test_identifier_holder_kind_part_in_test_part_muzziyfgsl violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_identifier_holder_kind_part_in_test_part_muzziyfgsl'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestIdentifier",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestIdentifier"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_lzm5dhjavd"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_ugowcjjitf"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."test_part" AS "r1" WHERE "r1"."id" = OLD."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."holder" AS "c1" FROM "qti"."test_identifier" AS "r1" WHERE "r1"."holder" = OLD."id" AND "r1"."holder_kind" = 'part'::"qti"."structure_holder" ORDER BY "r1"."holder" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __test_identifier_holder_kind_part_in_test_part_muzziyfgsl violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_identifier_holder_kind_part_in_test_part_muzziyfgsl'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestIdentifier",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestIdentifier"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_ugowcjjitf"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_test_identifier_holder_kind_part_in_test_part_vbesroqe6o"
  AFTER INSERT ON "qti"."test_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."holder_kind" = 'part'::"qti"."structure_holder")
  EXECUTE FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_lzm5dhjavd"();

CREATE CONSTRAINT TRIGGER "__law_test_identifier_holder_kind_part_in_test_part_chrufdfrtk"
  AFTER DELETE ON "qti"."test_part"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_test_identifier_holder_kind_part_in_test_part_ugowcjjitf"();

-- The full violation query of law __test_identifier_holder_kind_part_in_test_part_muzziyfgsl.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "holder" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."holder", "r1"."holder_kind", "r1"."identifier", "r1"."scope" FROM "qti"."test_identifier" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c2" = 'part'::"qti"."structure_holder") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."identifier", "r5"."navigation_mode", "r5"."submission_mode" FROM "qti"."test_part" AS "r5") AS "r6"("c7", "c8", "c9", "c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c6")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __test_identifier_holder_kind_part_in_test_part_muzziyfgsl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__test_identifier_holder_kind_part_in_test_part_muzziyfgsl'::"pg_catalog"."text";
  END IF;
END
$$;
