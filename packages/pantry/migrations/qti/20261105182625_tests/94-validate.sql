-- Validate law __item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."item_variable_ref", "qti"."prefixed_variable_source" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_thwk3pmmmi"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = NEW."id" AND "r1"."test" = NEW."document";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."item_variable_ref" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."document" = NEW."document" AND "r1"."root" = 'test'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemVariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemVariableRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_thwk3pmmmi"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_jksxo5aanm"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."item_variable_ref" AS "r1" WHERE "r1"."id" = OLD."ref" AND "r1"."document" = OLD."test" AND "r1"."root" = 'test'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemVariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemVariableRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_jksxo5aanm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_item_variable_ref_root_test_in_prefixed_zmkztlut6c"
  AFTER INSERT ON "qti"."item_variable_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'test'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_thwk3pmmmi"();

CREATE CONSTRAINT TRIGGER "__law_item_variable_ref_root_test_in_prefixed_5jev6v5h5d"
  AFTER DELETE ON "qti"."prefixed_variable_source"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_variable_ref_root_test_in_prefixed_jksxo5aanm"();

-- The full violation query of law __item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c22" AS "id", "r9"."c23" AS "document" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c2", "r2"."c1" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."prefix", "r1"."root", "r1"."variable" FROM "qti"."item_variable_ref" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'test'::"qti"."root_kind") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c18", "r7"."c19" FROM (SELECT DISTINCT "r6"."c14", "r6"."c17" FROM (SELECT DISTINCT "r5"."document", "r5"."item_document", "r5"."item_ref", "r5"."prefix", "r5"."ref", "r5"."ref_kind", "r5"."source", "r5"."test" FROM "qti"."prefixed_variable_source" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14", "c15", "c16", "c17")) AS "r7"("c18", "c19")) AS "r8"("c20", "c21") WHERE "r8"."c20" = "r4"."c8" AND "r8"."c21" = "r4"."c9")) AS "r9"("c22", "c23")) THEN
    RAISE EXCEPTION 'law __item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__item_variable_ref_root_test_in_prefixed_variable_y5z6ktvjmw'::"pg_catalog"."text";
  END IF;
END
$$;
