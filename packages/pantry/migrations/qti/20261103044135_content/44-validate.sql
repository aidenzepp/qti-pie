-- Validate law __assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."assessment_item_label", "qti"."item_tool_both" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_assessment_item_label_version_3_0_1_in_item_yubcxatbiq"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'assessment_item_label'::text THEN
    IF NEW."version" = '3.0.1'::"qti"."schema_version" THEN
      PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = NEW."tree";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."assessment_item_label" AS "r1" WHERE "r1"."tree" = NEW."tree" AND "r1"."version" = '3.0.1'::"qti"."schema_version" ORDER BY "r1"."node" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["AssessmentItemLabel",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["AssessmentItemLabel"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = OLD."tree";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."assessment_item_label" AS "r1" WHERE "r1"."tree" = OLD."tree" AND "r1"."version" = '3.0.1'::"qti"."schema_version" ORDER BY "r1"."node" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["AssessmentItemLabel",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["AssessmentItemLabel"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_assessment_item_label_version_3_0_1_in_item_yubcxatbiq"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_assessment_item_label_version_3_0_1_in_item_3eva5toif4"
  AFTER INSERT ON "qti"."assessment_item_label"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_assessment_item_label_version_3_0_1_in_item_yubcxatbiq"();

CREATE CONSTRAINT TRIGGER "__law_assessment_item_label_version_3_0_1_in_item_3j3ria56xe"
  AFTER DELETE ON "qti"."item_tool_both"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_assessment_item_label_version_3_0_1_in_item_yubcxatbiq"();

-- The full violation query of law __assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "tree" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."node", "r1"."tree", "r1"."value", "r1"."version" FROM "qti"."assessment_item_label" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = '3.0.1'::"qti"."schema_version") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."tool_name", "r5"."tool_version", "r5"."tree" FROM "qti"."item_tool_both" AS "r5") AS "r6"("c7", "c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c6")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__assessment_item_label_version_3_0_1_in_item_tool_moaf5slf3i'::text;
  END IF;
END
$$;
