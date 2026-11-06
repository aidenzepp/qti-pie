-- Validate law __assessment_section_capacity_structure_child_t56qcqbwoc: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."assessment_section", "qti"."structure_child" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_assessment_section_capacity_structure_child_jtmmvp7x2b"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."assessment_section" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."structure_child" AS "r1" WHERE "r1"."parent" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __assessment_section_capacity_structure_child_t56qcqbwoc violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__assessment_section_capacity_structure_child_t56qcqbwoc'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssessmentSection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssessmentSection"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_assessment_section_capacity_structure_child_jtmmvp7x2b"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_assessment_section_capacity_structure_child_w22jwatiqr"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."assessment_section" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
    PERFORM 1 FROM "qti"."structure_child" AS "r1" WHERE "r1"."parent" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __assessment_section_capacity_structure_child_t56qcqbwoc violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__assessment_section_capacity_structure_child_t56qcqbwoc'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssessmentSection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssessmentSection"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_assessment_section_capacity_structure_child_w22jwatiqr"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_assessment_section_capacity_structure_child_k6js2xbtnj"
  AFTER INSERT ON "qti"."assessment_section"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_assessment_section_capacity_structure_child_jtmmvp7x2b"();

CREATE CONSTRAINT TRIGGER "__law_assessment_section_capacity_structure_child_ktiadppip5"
  AFTER DELETE ON "qti"."structure_child"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_assessment_section_capacity_structure_child_w22jwatiqr"();

-- The full violation query of law __assessment_section_capacity_structure_child_t56qcqbwoc.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c38" AS "id" FROM (WITH "r4"("c10") AS MATERIALIZED (SELECT DISTINCT "r3"."c9" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."fixed", "r1"."id", "r1"."identifier", "r1"."keep_together", "r1"."required", "r1"."title", "r1"."visible" FROM "qti"."assessment_section" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8")) AS "r3"("c9")), "r12"("c23", "c24") AS MATERIALIZED (SELECT DISTINCT "r11"."c21", "r11"."c22" FROM (SELECT "r10"."c20", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c15", "r9"."c16", "r9"."c17" FROM (SELECT DISTINCT "r8"."c12", "r8"."c13", "r8"."c14" FROM (SELECT DISTINCT "r7"."child", "r7"."child_kind", "r7"."parent" FROM "qti"."structure_child" AS "r7") AS "r8"("c12", "c13", "c14")) AS "r9"("c15", "c16", "c17")) AS "r10"("c18", "c19", "c20") GROUP BY "r10"."c20") AS "r11"("c21", "c22")) SELECT "r17"."c31" FROM (SELECT DISTINCT "r16"."c29" FROM (SELECT DISTINCT "r15"."c27", "r15"."c28" FROM (SELECT DISTINCT "r6"."c11", "r14"."c26" FROM (SELECT "r5"."c10" FROM "r4" AS "r5") AS "r6"("c11"), (SELECT "r13"."c23", "r13"."c24" FROM "r12" AS "r13") AS "r14"("c25", "c26") WHERE "r6"."c11" = "r14"."c25") AS "r15"("c27", "c28") WHERE "r15"."c28" < 1::bigint) AS "r16"("c29", "c30")) AS "r17"("c31") UNION SELECT "r24"."c37" FROM (SELECT DISTINCT "r23"."c36" FROM (SELECT DISTINCT "r22"."c35" FROM (SELECT DISTINCT "r19"."c32" FROM (SELECT "r18"."c10" FROM "r4" AS "r18") AS "r19"("c32") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c23", "r20"."c24" FROM "r12" AS "r20") AS "r21"("c33", "c34") WHERE "r21"."c33" = "r19"."c32")) AS "r22"("c35") WHERE 0::bigint < 1::bigint) AS "r23"("c36")) AS "r24"("c37")) AS "r25"("c38")) THEN
    RAISE EXCEPTION 'law __assessment_section_capacity_structure_child_t56qcqbwoc is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__assessment_section_capacity_structure_child_t56qcqbwoc'::"pg_catalog"."text";
  END IF;
END
$$;
