-- Validate law __selection_bounded_capacity_structure_child_6zbhdni75o: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."selection_bounded", "qti"."structure_child" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_bb2epfvo6t"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."section" AS "c1", "r1"."select" AS "c2" FROM "qti"."selection_bounded" AS "r1" WHERE "r1"."section" = NEW."section" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."structure_child" AS "r1" WHERE "r1"."parent" = "t"."c1" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."structure_child" AS "r3" WHERE "r3"."parent" = "t"."c1") LOOP
      IF "g"."c1" < "t"."c2"::bigint THEN
        RAISE EXCEPTION 'law __selection_bounded_capacity_structure_child_6zbhdni75o violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__selection_bounded_capacity_structure_child_6zbhdni75o'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SelectionBounded",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SelectionBounded"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_bb2epfvo6t"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_h7wmvouzqm"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."section" AS "c1", "r1"."select" AS "c2" FROM "qti"."selection_bounded" AS "r1" WHERE "r1"."section" = OLD."parent" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."structure_child" AS "r1" WHERE "r1"."parent" = "t"."c1" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."structure_child" AS "r3" WHERE "r3"."parent" = "t"."c1") LOOP
      IF "g"."c1" < "t"."c2"::bigint THEN
        RAISE EXCEPTION 'law __selection_bounded_capacity_structure_child_6zbhdni75o violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__selection_bounded_capacity_structure_child_6zbhdni75o'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SelectionBounded",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SelectionBounded"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_h7wmvouzqm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_selection_bounded_capacity_structure_child_v3z2p6jbkl"
  AFTER INSERT ON "qti"."selection_bounded"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_bb2epfvo6t"();

CREATE CONSTRAINT TRIGGER "__law_selection_bounded_capacity_structure_child_2x7nvjrv65"
  AFTER DELETE ON "qti"."structure_child"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_selection_bounded_capacity_structure_child_h7wmvouzqm"();

-- The full violation query of law __selection_bounded_capacity_structure_child_6zbhdni75o.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c41" AS "section" FROM (WITH "r4"("c6", "c7") AS MATERIALIZED (SELECT DISTINCT "r3"."c4", "r3"."c5" FROM (SELECT DISTINCT "r2"."c1", "r2"."c2" FROM (SELECT DISTINCT "r1"."section", "r1"."select", "r1"."with_replacement" FROM "qti"."selection_bounded" AS "r1") AS "r2"("c1", "c2", "c3")) AS "r3"("c4", "c5")), "r12"("c21", "c22") AS MATERIALIZED (SELECT DISTINCT "r11"."c19", "r11"."c20" FROM (SELECT "r10"."c18", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c13", "r9"."c14", "r9"."c15" FROM (SELECT DISTINCT "r8"."c10", "r8"."c11", "r8"."c12" FROM (SELECT DISTINCT "r7"."child", "r7"."child_kind", "r7"."parent" FROM "qti"."structure_child" AS "r7") AS "r8"("c10", "c11", "c12")) AS "r9"("c13", "c14", "c15")) AS "r10"("c16", "c17", "c18") GROUP BY "r10"."c18") AS "r11"("c19", "c20")) SELECT "r17"."c31" FROM (SELECT DISTINCT "r16"."c28" FROM (SELECT DISTINCT "r15"."c25", "r15"."c26", "r15"."c27" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9", "r14"."c24" FROM (SELECT "r5"."c6", "r5"."c7" FROM "r4" AS "r5") AS "r6"("c8", "c9"), (SELECT "r13"."c21", "r13"."c22" FROM "r12" AS "r13") AS "r14"("c23", "c24") WHERE "r6"."c8" = "r14"."c23") AS "r15"("c25", "c26", "c27") WHERE "r15"."c27" < "r15"."c26") AS "r16"("c28", "c29", "c30")) AS "r17"("c31") UNION SELECT "r24"."c40" FROM (SELECT DISTINCT "r23"."c38" FROM (SELECT DISTINCT "r22"."c36", "r22"."c37" FROM (SELECT DISTINCT "r19"."c32", "r19"."c33" FROM (SELECT "r18"."c6", "r18"."c7" FROM "r4" AS "r18") AS "r19"("c32", "c33") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c21", "r20"."c22" FROM "r12" AS "r20") AS "r21"("c34", "c35") WHERE "r21"."c34" = "r19"."c32")) AS "r22"("c36", "c37") WHERE 0::bigint < "r22"."c37") AS "r23"("c38", "c39")) AS "r24"("c40")) AS "r25"("c41")) THEN
    RAISE EXCEPTION 'law __selection_bounded_capacity_structure_child_6zbhdni75o is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__selection_bounded_capacity_structure_child_6zbhdni75o'::"pg_catalog"."text";
  END IF;
END
$$;
