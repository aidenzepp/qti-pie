-- Validate law __edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."structure_child" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_hfsn3g56po"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."structure_child" AS "r1" WHERE "r1"."child" = NEW."child" AND "r1"."parent" = NEW."parent";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."parent" AS "c1", "r1"."position" AS "c2" FROM "qti"."edge" AS "r1" WHERE "r1"."child" = NEW."child" AND "r1"."parent" = NEW."parent" AND ("r1"."child_kind" = 'qti-assessment-section'::"qti"."node_kind" AND "r1"."parent_kind" = 'qti-test-part'::"qti"."node_kind") ORDER BY "r1"."parent", "r1"."position" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Edge",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Edge"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_hfsn3g56po"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_yi7vq7kwds"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."structure_child" AS "r1" WHERE "r1"."child" = OLD."child" AND "r1"."parent" = OLD."parent";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."parent" AS "c1", "r1"."position" AS "c2" FROM "qti"."edge" AS "r1" WHERE "r1"."child" = OLD."child" AND "r1"."parent" = OLD."parent" AND ("r1"."child_kind" = 'qti-assessment-section'::"qti"."node_kind" AND "r1"."parent_kind" = 'qti-test-part'::"qti"."node_kind") ORDER BY "r1"."parent", "r1"."position" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Edge",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Edge"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_yi7vq7kwds"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_edge_child_kind_qti_assessment_section_parent_2b6rlnhbbw"
  AFTER INSERT ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."child_kind" = 'qti-assessment-section'::"qti"."node_kind" AND NEW."parent_kind" = 'qti-test-part'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_hfsn3g56po"();

CREATE CONSTRAINT TRIGGER "__law_edge_child_kind_qti_assessment_section_parent_csdpmaxlqv"
  AFTER DELETE ON "qti"."structure_child"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_edge_child_kind_qti_assessment_section_parent_yi7vq7kwds"();

-- The full violation query of law __edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c21" AS "child", "r9"."c22" AS "parent" FROM (SELECT DISTINCT "r4"."c12", "r4"."c13" FROM (SELECT DISTINCT "r3"."c10", "r3"."c11" FROM (SELECT DISTINCT "r2"."c1", "r2"."c4" FROM (SELECT DISTINCT "r1"."child", "r1"."child_ancestry", "r1"."child_kind", "r1"."parent", "r1"."parent_ancestry", "r1"."parent_kind", "r1"."position", "r1"."tree", "r1"."version" FROM "qti"."edge" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9") WHERE "r2"."c3" = 'qti-assessment-section'::"qti"."node_kind" AND "r2"."c6" = 'qti-test-part'::"qti"."node_kind") AS "r3"("c10", "c11")) AS "r4"("c12", "c13") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c14", "r6"."c16" FROM (SELECT DISTINCT "r5"."child", "r5"."child_kind", "r5"."parent" FROM "qti"."structure_child" AS "r5") AS "r6"("c14", "c15", "c16")) AS "r7"("c17", "c18")) AS "r8"("c19", "c20") WHERE "r8"."c19" = "r4"."c12" AND "r8"."c20" = "r4"."c13")) AS "r9"("c21", "c22")) THEN
    RAISE EXCEPTION 'law __edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__edge_child_kind_qti_assessment_section_parent_kind_y5u2f5zolh'::"pg_catalog"."text";
  END IF;
END
$$;
