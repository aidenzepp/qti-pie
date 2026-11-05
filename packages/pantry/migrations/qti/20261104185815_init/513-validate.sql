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
  IF EXISTS (SELECT "r27"."c57" AS "id" FROM (SELECT "r13"."c29" FROM (SELECT DISTINCT "r12"."c27" FROM (SELECT DISTINCT "r11"."c25", "r11"."c26" FROM (SELECT DISTINCT "r4"."c8", "r10"."c24" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data" FROM "qti"."statistic" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")) AS "r4"("c8"), (SELECT DISTINCT "r9"."c21", "r9"."c22" FROM (SELECT "r8"."c20", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."position", "r5"."statistic" FROM "qti"."target_object" AS "r5") AS "r6"("c9", "c10", "c11", "c12")) AS "r7"("c13", "c14", "c15", "c16")) AS "r8"("c17", "c18", "c19", "c20") GROUP BY "r8"."c20") AS "r9"("c21", "c22")) AS "r10"("c23", "c24") WHERE "r4"."c8" = "r10"."c23") AS "r11"("c25", "c26") WHERE "r11"."c26" < 1::bigint) AS "r12"("c27", "c28")) AS "r13"("c29") UNION SELECT "r26"."c56" FROM (SELECT DISTINCT "r25"."c55" FROM (SELECT DISTINCT "r24"."c54" FROM (SELECT DISTINCT "r17"."c37" FROM (SELECT DISTINCT "r16"."c36" FROM (SELECT DISTINCT "r15"."c31" FROM (SELECT DISTINCT "r14"."context", "r14"."id", "r14"."kind", "r14"."name", "r14"."position", "r14"."usage_data" FROM "qti"."statistic" AS "r14") AS "r15"("c30", "c31", "c32", "c33", "c34", "c35")) AS "r16"("c36")) AS "r17"("c37") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c50", "r22"."c51" FROM (SELECT "r21"."c49", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c42", "r20"."c43", "r20"."c44", "r20"."c45" FROM (SELECT DISTINCT "r19"."c38", "r19"."c39", "r19"."c40", "r19"."c41" FROM (SELECT DISTINCT "r18"."id", "r18"."identifier", "r18"."position", "r18"."statistic" FROM "qti"."target_object" AS "r18") AS "r19"("c38", "c39", "c40", "c41")) AS "r20"("c42", "c43", "c44", "c45")) AS "r21"("c46", "c47", "c48", "c49") GROUP BY "r21"."c49") AS "r22"("c50", "c51")) AS "r23"("c52", "c53") WHERE "r23"."c52" = "r17"."c37")) AS "r24"("c54") WHERE 0::bigint < 1::bigint) AS "r25"("c55")) AS "r26"("c56")) AS "r27"("c57")) THEN
    RAISE EXCEPTION 'law __statistic_capacity_target_object_z4slqcovi7 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__statistic_capacity_target_object_z4slqcovi7'::"pg_catalog"."text";
  END IF;
END
$$;
