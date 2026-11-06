-- Validate law __test_part_capacity_structure_child_3ghnkrixee: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."structure_child", "qti"."test_part" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_test_part_capacity_structure_child_5k6hpcpayk"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."test_part" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
    PERFORM 1 FROM "qti"."structure_child" AS "r1" WHERE "r1"."parent" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __test_part_capacity_structure_child_3ghnkrixee violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_part_capacity_structure_child_3ghnkrixee'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestPart",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestPart"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_part_capacity_structure_child_5k6hpcpayk"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_test_part_capacity_structure_child_hewaxi3pyv"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."test_part" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."structure_child" AS "r1" WHERE "r1"."parent" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __test_part_capacity_structure_child_3ghnkrixee violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__test_part_capacity_structure_child_3ghnkrixee'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["TestPart",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["TestPart"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_test_part_capacity_structure_child_hewaxi3pyv"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_test_part_capacity_structure_child_bzcgy4xhcv"
  AFTER DELETE ON "qti"."structure_child"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_test_part_capacity_structure_child_5k6hpcpayk"();

CREATE CONSTRAINT TRIGGER "__law_test_part_capacity_structure_child_duut6bjvtv"
  AFTER INSERT ON "qti"."test_part"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_test_part_capacity_structure_child_hewaxi3pyv"();

-- The full violation query of law __test_part_capacity_structure_child_3ghnkrixee.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c35" AS "id" FROM (WITH "r4"("c7") AS MATERIALIZED (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."identifier", "r1"."navigation_mode", "r1"."submission_mode" FROM "qti"."test_part" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5")) AS "r3"("c6")), "r12"("c20", "c21") AS MATERIALIZED (SELECT DISTINCT "r11"."c18", "r11"."c19" FROM (SELECT "r10"."c17", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c12", "r9"."c13", "r9"."c14" FROM (SELECT DISTINCT "r8"."c9", "r8"."c10", "r8"."c11" FROM (SELECT DISTINCT "r7"."child", "r7"."child_kind", "r7"."parent" FROM "qti"."structure_child" AS "r7") AS "r8"("c9", "c10", "c11")) AS "r9"("c12", "c13", "c14")) AS "r10"("c15", "c16", "c17") GROUP BY "r10"."c17") AS "r11"("c18", "c19")) SELECT "r17"."c28" FROM (SELECT DISTINCT "r16"."c26" FROM (SELECT DISTINCT "r15"."c24", "r15"."c25" FROM (SELECT DISTINCT "r6"."c8", "r14"."c23" FROM (SELECT "r5"."c7" FROM "r4" AS "r5") AS "r6"("c8"), (SELECT "r13"."c20", "r13"."c21" FROM "r12" AS "r13") AS "r14"("c22", "c23") WHERE "r6"."c8" = "r14"."c22") AS "r15"("c24", "c25") WHERE "r15"."c25" < 1::bigint) AS "r16"("c26", "c27")) AS "r17"("c28") UNION SELECT "r24"."c34" FROM (SELECT DISTINCT "r23"."c33" FROM (SELECT DISTINCT "r22"."c32" FROM (SELECT DISTINCT "r19"."c29" FROM (SELECT "r18"."c7" FROM "r4" AS "r18") AS "r19"("c29") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c20", "r20"."c21" FROM "r12" AS "r20") AS "r21"("c30", "c31") WHERE "r21"."c30" = "r19"."c29")) AS "r22"("c32") WHERE 0::bigint < 1::bigint) AS "r23"("c33")) AS "r24"("c34")) AS "r25"("c35")) THEN
    RAISE EXCEPTION 'law __test_part_capacity_structure_child_3ghnkrixee is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__test_part_capacity_structure_child_3ghnkrixee'::"pg_catalog"."text";
  END IF;
END
$$;
