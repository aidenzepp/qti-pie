-- Validate law __statistic_capacity_target_object_z4slqcovi7: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."statistic", "qti"."target_object" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_capacity_target_object_jwbfnhod3j"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."target_object" AS "r1" WHERE "r1"."statistic" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __statistic_capacity_target_object_z4slqcovi7 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__statistic_capacity_target_object_z4slqcovi7'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Statistic",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Statistic"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_capacity_target_object_jwbfnhod3j"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_capacity_target_object_lhqzaxkdkk"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = OLD."statistic" LOOP
    PERFORM 1 FROM "qti"."target_object" AS "r1" WHERE "r1"."statistic" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __statistic_capacity_target_object_z4slqcovi7 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__statistic_capacity_target_object_z4slqcovi7'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Statistic",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Statistic"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_capacity_target_object_lhqzaxkdkk"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_statistic_capacity_target_object_ywledbr3se"
  AFTER INSERT ON "qti"."statistic"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_capacity_target_object_jwbfnhod3j"();

CREATE CONSTRAINT TRIGGER "__law_statistic_capacity_target_object_nv33ugddtt"
  AFTER DELETE ON "qti"."target_object"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_capacity_target_object_lhqzaxkdkk"();

-- The full violation query of law __statistic_capacity_target_object_z4slqcovi7.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c39" AS "id" FROM (WITH "r4"("c8") AS MATERIALIZED (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data" FROM "qti"."statistic" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")), "r12"("c24", "c25") AS MATERIALIZED (SELECT DISTINCT "r11"."c22", "r11"."c23" FROM (SELECT "r10"."c21", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c14", "r9"."c15", "r9"."c16", "r9"."c17" FROM (SELECT DISTINCT "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13" FROM (SELECT DISTINCT "r7"."id", "r7"."identifier", "r7"."position", "r7"."statistic" FROM "qti"."target_object" AS "r7") AS "r8"("c10", "c11", "c12", "c13")) AS "r9"("c14", "c15", "c16", "c17")) AS "r10"("c18", "c19", "c20", "c21") GROUP BY "r10"."c21") AS "r11"("c22", "c23")) SELECT "r17"."c32" FROM (SELECT DISTINCT "r16"."c30" FROM (SELECT DISTINCT "r15"."c28", "r15"."c29" FROM (SELECT DISTINCT "r6"."c9", "r14"."c27" FROM (SELECT "r5"."c8" FROM "r4" AS "r5") AS "r6"("c9"), (SELECT "r13"."c24", "r13"."c25" FROM "r12" AS "r13") AS "r14"("c26", "c27") WHERE "r6"."c9" = "r14"."c26") AS "r15"("c28", "c29") WHERE "r15"."c29" < 1::bigint) AS "r16"("c30", "c31")) AS "r17"("c32") UNION SELECT "r24"."c38" FROM (SELECT DISTINCT "r23"."c37" FROM (SELECT DISTINCT "r22"."c36" FROM (SELECT DISTINCT "r19"."c33" FROM (SELECT "r18"."c8" FROM "r4" AS "r18") AS "r19"("c33") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c24", "r20"."c25" FROM "r12" AS "r20") AS "r21"("c34", "c35") WHERE "r21"."c34" = "r19"."c33")) AS "r22"("c36") WHERE 0::bigint < 1::bigint) AS "r23"("c37")) AS "r24"("c38")) AS "r25"("c39")) THEN
    RAISE EXCEPTION 'law __statistic_capacity_target_object_z4slqcovi7 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__statistic_capacity_target_object_z4slqcovi7'::"pg_catalog"."text";
  END IF;
END
$$;
