-- Validate law __assessment_section_required_1_in_required_child_2hdfmu75ry: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."assessment_section", "qti"."required_child" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_assessment_section_required_1_in_required_zrlikmlvwi"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."required_child" AS "r1" WHERE "r1"."child" = NEW."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."assessment_section" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."required" = '1'::"qti"."xs_boolean" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __assessment_section_required_1_in_required_child_2hdfmu75ry violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__assessment_section_required_1_in_required_child_2hdfmu75ry'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssessmentSection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssessmentSection"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_assessment_section_required_1_in_required_zrlikmlvwi"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_assessment_section_required_1_in_required_nqyoqfqaex"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."required_child" AS "r1" WHERE "r1"."child" = OLD."child";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."assessment_section" AS "r1" WHERE "r1"."id" = OLD."child" AND "r1"."required" = '1'::"qti"."xs_boolean" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __assessment_section_required_1_in_required_child_2hdfmu75ry violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__assessment_section_required_1_in_required_child_2hdfmu75ry'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssessmentSection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssessmentSection"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_assessment_section_required_1_in_required_nqyoqfqaex"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_assessment_section_required_1_in_required_74ylj7rsnv"
  AFTER INSERT ON "qti"."assessment_section"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."required" = '1'::"qti"."xs_boolean")
  EXECUTE FUNCTION "qti"."__law_assessment_section_required_1_in_required_zrlikmlvwi"();

CREATE CONSTRAINT TRIGGER "__law_assessment_section_required_1_in_required_er5tgyiqrb"
  AFTER DELETE ON "qti"."required_child"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_assessment_section_required_1_in_required_nqyoqfqaex"();

-- The full violation query of law __assessment_section_required_1_in_required_child_2hdfmu75ry.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c16" AS "id" FROM (SELECT DISTINCT "r4"."c10" FROM (SELECT DISTINCT "r3"."c9" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."fixed", "r1"."id", "r1"."identifier", "r1"."keep_together", "r1"."required", "r1"."title", "r1"."visible" FROM "qti"."assessment_section" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8") WHERE "r2"."c6" = '1'::"qti"."xs_boolean") AS "r3"("c9")) AS "r4"("c10") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14" FROM (SELECT DISTINCT "r6"."c11" FROM (SELECT DISTINCT "r5"."child", "r5"."parent", "r5"."required" FROM "qti"."required_child" AS "r5") AS "r6"("c11", "c12", "c13")) AS "r7"("c14")) AS "r8"("c15") WHERE "r8"."c15" = "r4"."c10")) AS "r9"("c16")) THEN
    RAISE EXCEPTION 'law __assessment_section_required_1_in_required_child_2hdfmu75ry is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__assessment_section_required_1_in_required_child_2hdfmu75ry'::"pg_catalog"."text";
  END IF;
END
$$;
