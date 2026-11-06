-- Validate law __item_ref_required_true_in_required_child_qpsrxkthbp: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."item_ref", "qti"."required_child" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_item_ref_required_true_in_required_child_ntscar6a2o"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."required_child" AS "r1" WHERE "r1"."child" = NEW."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."item_ref" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."required" = 'true'::"qti"."xs_boolean" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_ref_required_true_in_required_child_qpsrxkthbp violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_ref_required_true_in_required_child_qpsrxkthbp'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_ref_required_true_in_required_child_ntscar6a2o"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_item_ref_required_true_in_required_child_glq6jjcue7"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."required_child" AS "r1" WHERE "r1"."child" = OLD."child";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."item_ref" AS "r1" WHERE "r1"."id" = OLD."child" AND "r1"."required" = 'true'::"qti"."xs_boolean" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_ref_required_true_in_required_child_qpsrxkthbp violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_ref_required_true_in_required_child_qpsrxkthbp'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemRef"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_ref_required_true_in_required_child_glq6jjcue7"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_item_ref_required_true_in_required_child_wot4b4wcm4"
  AFTER INSERT ON "qti"."item_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."required" = 'true'::"qti"."xs_boolean")
  EXECUTE FUNCTION "qti"."__law_item_ref_required_true_in_required_child_ntscar6a2o"();

CREATE CONSTRAINT TRIGGER "__law_item_ref_required_true_in_required_child_evtnimj6nr"
  AFTER DELETE ON "qti"."required_child"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_ref_required_true_in_required_child_glq6jjcue7"();

-- The full violation query of law __item_ref_required_true_in_required_child_qpsrxkthbp.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "id" FROM (SELECT DISTINCT "r4"."c8" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c4" FROM (SELECT DISTINCT "r1"."document", "r1"."fixed", "r1"."href", "r1"."id", "r1"."identifier", "r1"."required" FROM "qti"."item_ref" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c6" = 'true'::"qti"."xs_boolean") AS "r3"("c7")) AS "r4"("c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."child", "r5"."parent", "r5"."required" FROM "qti"."required_child" AS "r5") AS "r6"("c9", "c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c8")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __item_ref_required_true_in_required_child_qpsrxkthbp is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__item_ref_required_true_in_required_child_qpsrxkthbp'::"pg_catalog"."text";
  END IF;
END
$$;
