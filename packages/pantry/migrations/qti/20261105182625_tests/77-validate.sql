-- Validate law __test_rubric_block_capacity_edge_lyqfmy7uj2: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."test_rubric_block" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_test_rubric_block_capacity_edge_ectvou3a7g"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."test_rubric_block" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
    PERFORM 1 FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND ("r1"."child_kind" = 'qti-content-body.testRubric'::"qti"."node_kind" AND "r1"."parent_kind" = 'qti-rubric-block.test'::"qti"."node_kind") LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __test_rubric_block_capacity_edge_lyqfmy7uj2 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_rubric_block_capacity_edge_lyqfmy7uj2'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestRubricBlock",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestRubricBlock"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_rubric_block_capacity_edge_ectvou3a7g"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_test_rubric_block_capacity_edge_pwh7a7a4zn"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."test_rubric_block" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND ("r1"."child_kind" = 'qti-content-body.testRubric'::"qti"."node_kind" AND "r1"."parent_kind" = 'qti-rubric-block.test'::"qti"."node_kind") LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __test_rubric_block_capacity_edge_lyqfmy7uj2 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_rubric_block_capacity_edge_lyqfmy7uj2'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestRubricBlock",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestRubricBlock"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_rubric_block_capacity_edge_pwh7a7a4zn"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_test_rubric_block_capacity_edge_m4a5uoc2az"
  AFTER DELETE ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (OLD."child_kind" = 'qti-content-body.testRubric'::"qti"."node_kind" AND OLD."parent_kind" = 'qti-rubric-block.test'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_test_rubric_block_capacity_edge_ectvou3a7g"();

CREATE CONSTRAINT TRIGGER "__law_test_rubric_block_capacity_edge_3vabswvyor"
  AFTER INSERT ON "qti"."test_rubric_block"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_test_rubric_block_capacity_edge_pwh7a7a4zn"();

-- The full violation query of law __test_rubric_block_capacity_edge_lyqfmy7uj2.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c50" AS "id" FROM (WITH "r4"("c4") AS MATERIALIZED (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."view" FROM "qti"."test_rubric_block" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")), "r12"("c35", "c36") AS MATERIALIZED (SELECT DISTINCT "r11"."c33", "r11"."c34" FROM (SELECT "r10"."c27", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c15", "r9"."c16", "r9"."c17", "r9"."c18", "r9"."c19", "r9"."c20", "r9"."c21", "r9"."c22", "r9"."c23" FROM (SELECT DISTINCT "r8"."c6", "r8"."c7", "r8"."c8", "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13", "r8"."c14" FROM (SELECT DISTINCT "r7"."child", "r7"."child_ancestry", "r7"."child_kind", "r7"."parent", "r7"."parent_ancestry", "r7"."parent_kind", "r7"."position", "r7"."tree", "r7"."version" FROM "qti"."edge" AS "r7") AS "r8"("c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13", "c14") WHERE "r8"."c8" = 'qti-content-body.testRubric'::"qti"."node_kind" AND "r8"."c11" = 'qti-rubric-block.test'::"qti"."node_kind") AS "r9"("c15", "c16", "c17", "c18", "c19", "c20", "c21", "c22", "c23")) AS "r10"("c24", "c25", "c26", "c27", "c28", "c29", "c30", "c31", "c32") GROUP BY "r10"."c27") AS "r11"("c33", "c34")) SELECT "r17"."c43" FROM (SELECT DISTINCT "r16"."c41" FROM (SELECT DISTINCT "r15"."c39", "r15"."c40" FROM (SELECT DISTINCT "r6"."c5", "r14"."c38" FROM (SELECT "r5"."c4" FROM "r4" AS "r5") AS "r6"("c5"), (SELECT "r13"."c35", "r13"."c36" FROM "r12" AS "r13") AS "r14"("c37", "c38") WHERE "r6"."c5" = "r14"."c37") AS "r15"("c39", "c40") WHERE "r15"."c40" < 1::bigint OR "r15"."c40" > 1::bigint) AS "r16"("c41", "c42")) AS "r17"("c43") UNION SELECT "r24"."c49" FROM (SELECT DISTINCT "r23"."c48" FROM (SELECT DISTINCT "r22"."c47" FROM (SELECT DISTINCT "r19"."c44" FROM (SELECT "r18"."c4" FROM "r4" AS "r18") AS "r19"("c44") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c35", "r20"."c36" FROM "r12" AS "r20") AS "r21"("c45", "c46") WHERE "r21"."c45" = "r19"."c44")) AS "r22"("c47") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c48")) AS "r24"("c49")) AS "r25"("c50")) THEN
    RAISE EXCEPTION 'law __test_rubric_block_capacity_edge_lyqfmy7uj2 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__test_rubric_block_capacity_edge_lyqfmy7uj2'::"pg_catalog"."text";
  END IF;
END
$$;
