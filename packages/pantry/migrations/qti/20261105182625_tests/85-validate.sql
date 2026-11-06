-- Validate law __item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."item_instance_variable_ref", "qti"."prefixed_variable_source" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_oaolbulyaz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = NEW."id" AND "r1"."test" = NEW."document";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."item_instance_variable_ref" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."document" = NEW."document" AND "r1"."root" = 'test'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemInstanceVariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemInstanceVariableRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_oaolbulyaz"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_r7t5xavw7y"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."item_instance_variable_ref" AS "r1" WHERE "r1"."id" = OLD."ref" AND "r1"."document" = OLD."test" AND "r1"."root" = 'test'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemInstanceVariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemInstanceVariableRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_r7t5xavw7y"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_item_instance_variable_ref_root_test_in_tetfyu2347"
  AFTER INSERT ON "qti"."item_instance_variable_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'test'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_oaolbulyaz"();

CREATE CONSTRAINT TRIGGER "__law_item_instance_variable_ref_root_test_in_34qki7klgh"
  AFTER DELETE ON "qti"."prefixed_variable_source"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_instance_variable_ref_root_test_in_r7t5xavw7y"();

-- The full violation query of law __item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c23" AS "id", "r9"."c24" AS "document" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10" FROM (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c2", "r2"."c1" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."instance", "r1"."prefix", "r1"."root", "r1"."variable" FROM "qti"."item_instance_variable_ref" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c5" = 'test'::"qti"."root_kind") AS "r3"("c7", "c8")) AS "r4"("c9", "c10") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c19", "r7"."c20" FROM (SELECT DISTINCT "r6"."c15", "r6"."c18" FROM (SELECT DISTINCT "r5"."document", "r5"."item_document", "r5"."item_ref", "r5"."prefix", "r5"."ref", "r5"."ref_kind", "r5"."source", "r5"."test" FROM "qti"."prefixed_variable_source" AS "r5") AS "r6"("c11", "c12", "c13", "c14", "c15", "c16", "c17", "c18")) AS "r7"("c19", "c20")) AS "r8"("c21", "c22") WHERE "r8"."c21" = "r4"."c9" AND "r8"."c22" = "r4"."c10")) AS "r9"("c23", "c24")) THEN
    RAISE EXCEPTION 'law __item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__item_instance_variable_ref_root_test_in_prefixed_pk3c5row7o'::"pg_catalog"."text";
  END IF;
END
$$;
