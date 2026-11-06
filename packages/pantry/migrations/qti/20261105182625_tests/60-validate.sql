-- Validate law __assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."assessment_item_label", "qti"."item_tool_both" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_pr55plqugw"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = NEW."tree";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."assessment_item_label" AS "r1" WHERE "r1"."tree" = NEW."tree" AND ("r1"."root" = 'item'::"qti"."root_kind" AND "r1"."version" = '3.0.1'::"qti"."schema_version") ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssessmentItemLabel",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssessmentItemLabel"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_pr55plqugw"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_vdb5do75or"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = OLD."tree";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."assessment_item_label" AS "r1" WHERE "r1"."tree" = OLD."tree" AND ("r1"."root" = 'item'::"qti"."root_kind" AND "r1"."version" = '3.0.1'::"qti"."schema_version") ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssessmentItemLabel",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssessmentItemLabel"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_vdb5do75or"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_assessment_item_label_root_item_version_3_0_1_kowlhsvifo"
  AFTER INSERT ON "qti"."assessment_item_label"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'item'::"qti"."root_kind" AND NEW."version" = '3.0.1'::"qti"."schema_version")
  EXECUTE FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_pr55plqugw"();

CREATE CONSTRAINT TRIGGER "__law_assessment_item_label_root_item_version_3_0_1_z6rn2kkbdp"
  AFTER DELETE ON "qti"."item_tool_both"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_assessment_item_label_root_item_version_3_0_1_vdb5do75or"();

-- The full violation query of law __assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c13" AS "tree" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."node", "r1"."root", "r1"."tree", "r1"."value", "r1"."version" FROM "qti"."assessment_item_label" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c2" = 'item'::"qti"."root_kind" AND "r2"."c5" = '3.0.1'::"qti"."schema_version") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."tool_name", "r5"."tool_version", "r5"."tree" FROM "qti"."item_tool_both" AS "r5") AS "r6"("c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c7")) AS "r9"("c13")) THEN
    RAISE EXCEPTION 'law __assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__assessment_item_label_root_item_version_3_0_1_in_uu7vmgvqwp'::"pg_catalog"."text";
  END IF;
END
$$;
