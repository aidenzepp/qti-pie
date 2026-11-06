-- Validate law __test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."item_ref", "qti"."test_identifier" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_piebqdloyh"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."item_ref" AS "r1" WHERE "r1"."id" = OLD."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."holder" AS "c1" FROM "qti"."test_identifier" AS "r1" WHERE "r1"."holder" = OLD."id" AND "r1"."holder_kind" = 'itemRef'::"qti"."structure_holder" ORDER BY "r1"."holder" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestIdentifier",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestIdentifier"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_piebqdloyh"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_uinkslxwrw"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."item_ref" AS "r1" WHERE "r1"."id" = NEW."holder";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."holder" AS "c1" FROM "qti"."test_identifier" AS "r1" WHERE "r1"."holder" = NEW."holder" AND "r1"."holder_kind" = 'itemRef'::"qti"."structure_holder" ORDER BY "r1"."holder" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestIdentifier",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestIdentifier"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_uinkslxwrw"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_test_identifier_holder_kind_item_ref_in_item_d6crvfx4vc"
  AFTER DELETE ON "qti"."item_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_piebqdloyh"();

CREATE CONSTRAINT TRIGGER "__law_test_identifier_holder_kind_item_ref_in_item_c54jh4vgaa"
  AFTER INSERT ON "qti"."test_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."holder_kind" = 'itemRef'::"qti"."structure_holder")
  EXECUTE FUNCTION "qti"."__law_test_identifier_holder_kind_item_ref_in_item_uinkslxwrw"();

-- The full violation query of law __test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c15" AS "holder" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."holder", "r1"."holder_kind", "r1"."identifier", "r1"."scope" FROM "qti"."test_identifier" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c2" = 'itemRef'::"qti"."structure_holder") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."document", "r5"."fixed", "r5"."href", "r5"."id", "r5"."identifier", "r5"."required" FROM "qti"."item_ref" AS "r5") AS "r6"("c7", "c8", "c9", "c10", "c11", "c12")) AS "r7"("c13")) AS "r8"("c14") WHERE "r8"."c14" = "r4"."c6")) AS "r9"("c15")) THEN
    RAISE EXCEPTION 'law __test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__test_identifier_holder_kind_item_ref_in_item_ref_ugx5amoc27'::"pg_catalog"."text";
  END IF;
END
$$;
