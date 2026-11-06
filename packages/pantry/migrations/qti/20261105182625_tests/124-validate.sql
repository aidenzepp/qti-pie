-- Validate law __selection_capacity_required_child_jdj4hopbb4: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."required_child", "qti"."selection" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_selection_capacity_required_child_h2nhzvq4ny"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."section" AS "c1", "r1"."select" AS "c2" FROM "qti"."selection" AS "r1" WHERE "r1"."section" = NEW."parent" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."required_child" AS "r1" WHERE "r1"."parent" = "t"."c1" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."required_child" AS "r3" WHERE "r3"."parent" = "t"."c1") LOOP
      IF "g"."c1" > "t"."c2"::bigint THEN
        RAISE EXCEPTION 'law __selection_capacity_required_child_jdj4hopbb4 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__selection_capacity_required_child_jdj4hopbb4'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Selection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Selection"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_selection_capacity_required_child_h2nhzvq4ny"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_selection_capacity_required_child_y37j4hebkc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."section" AS "c1", "r1"."select" AS "c2" FROM "qti"."selection" AS "r1" WHERE "r1"."section" = NEW."section" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."required_child" AS "r1" WHERE "r1"."parent" = "t"."c1" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."required_child" AS "r3" WHERE "r3"."parent" = "t"."c1") LOOP
      IF "g"."c1" > "t"."c2"::bigint THEN
        RAISE EXCEPTION 'law __selection_capacity_required_child_jdj4hopbb4 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__selection_capacity_required_child_jdj4hopbb4'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Selection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Selection"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_selection_capacity_required_child_y37j4hebkc"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_selection_capacity_required_child_r5t4ypw5sg"
  AFTER INSERT ON "qti"."required_child"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_selection_capacity_required_child_h2nhzvq4ny"();

CREATE CONSTRAINT TRIGGER "__law_selection_capacity_required_child_pu26uvthcx"
  AFTER INSERT ON "qti"."selection"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_selection_capacity_required_child_y37j4hebkc"();

-- The full violation query of law __selection_capacity_required_child_jdj4hopbb4.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c42" AS "section" FROM (WITH "r4"("c7", "c8") AS MATERIALIZED (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c2", "r2"."c3" FROM (SELECT DISTINCT "r1"."id", "r1"."section", "r1"."select", "r1"."with_replacement" FROM "qti"."selection" AS "r1") AS "r2"("c1", "c2", "c3", "c4")) AS "r3"("c5", "c6")), "r12"("c22", "c23") AS MATERIALIZED (SELECT DISTINCT "r11"."c20", "r11"."c21" FROM (SELECT "r10"."c18", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c14", "r9"."c15", "r9"."c16" FROM (SELECT DISTINCT "r8"."c11", "r8"."c12", "r8"."c13" FROM (SELECT DISTINCT "r7"."child", "r7"."parent", "r7"."required" FROM "qti"."required_child" AS "r7") AS "r8"("c11", "c12", "c13")) AS "r9"("c14", "c15", "c16")) AS "r10"("c17", "c18", "c19") GROUP BY "r10"."c18") AS "r11"("c20", "c21")) SELECT "r17"."c32" FROM (SELECT DISTINCT "r16"."c29" FROM (SELECT DISTINCT "r15"."c26", "r15"."c27", "r15"."c28" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10", "r14"."c25" FROM (SELECT "r5"."c7", "r5"."c8" FROM "r4" AS "r5") AS "r6"("c9", "c10"), (SELECT "r13"."c22", "r13"."c23" FROM "r12" AS "r13") AS "r14"("c24", "c25") WHERE "r6"."c9" = "r14"."c24") AS "r15"("c26", "c27", "c28") WHERE "r15"."c28" < 0::bigint OR "r15"."c28" > "r15"."c27") AS "r16"("c29", "c30", "c31")) AS "r17"("c32") UNION SELECT "r24"."c41" FROM (SELECT DISTINCT "r23"."c39" FROM (SELECT DISTINCT "r22"."c37", "r22"."c38" FROM (SELECT DISTINCT "r19"."c33", "r19"."c34" FROM (SELECT "r18"."c7", "r18"."c8" FROM "r4" AS "r18") AS "r19"("c33", "c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c22", "r20"."c23" FROM "r12" AS "r20") AS "r21"("c35", "c36") WHERE "r21"."c35" = "r19"."c33")) AS "r22"("c37", "c38") WHERE 0::bigint < 0::bigint OR 0::bigint > "r22"."c38") AS "r23"("c39", "c40")) AS "r24"("c41")) AS "r25"("c42")) THEN
    RAISE EXCEPTION 'law __selection_capacity_required_child_jdj4hopbb4 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__selection_capacity_required_child_jdj4hopbb4'::"pg_catalog"."text";
  END IF;
END
$$;
