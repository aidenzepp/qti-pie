-- Validate law __resource_lom_titled_capacity_lom_general_title_vwt6bhndmk: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_general_title", "qti"."resource_lom_titled" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_capacity_lom_general_title_5gnv3pw7w6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = OLD."lom" LOOP
    PERFORM 1 FROM "qti"."lom_general_title" AS "r1" WHERE "r1"."lom" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __resource_lom_titled_capacity_lom_general_title_vwt6bhndmk violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__resource_lom_titled_capacity_lom_general_title_vwt6bhndmk'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_capacity_lom_general_title_5gnv3pw7w6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_capacity_lom_general_title_r5r6d23rff"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    PERFORM 1 FROM "qti"."lom_general_title" AS "r1" WHERE "r1"."lom" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __resource_lom_titled_capacity_lom_general_title_vwt6bhndmk violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__resource_lom_titled_capacity_lom_general_title_vwt6bhndmk'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_capacity_lom_general_title_r5r6d23rff"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_capacity_lom_general_title_bo2k25bkqu"
  AFTER DELETE ON "qti"."lom_general_title"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_titled_capacity_lom_general_title_5gnv3pw7w6"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_capacity_lom_general_title_25befxgf57"
  AFTER INSERT ON "qti"."resource_lom_titled"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_titled_capacity_lom_general_title_r5r6d23rff"();

-- The full violation query of law __resource_lom_titled_capacity_lom_general_title_vwt6bhndmk.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c47" AS "lom" FROM (SELECT "r13"."c24" FROM (SELECT DISTINCT "r12"."c22" FROM (SELECT DISTINCT "r11"."c20", "r11"."c21" FROM (SELECT DISTINCT "r4"."c6", "r10"."c19" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_titled" AS "r1") AS "r2"("c1", "c2", "c3", "c4")) AS "r3"("c5")) AS "r4"("c6"), (SELECT DISTINCT "r9"."c16", "r9"."c17" FROM (SELECT "r8"."c14", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c10", "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c7", "r6"."c8", "r6"."c9" FROM (SELECT DISTINCT "r5"."id", "r5"."lom", "r5"."owner" FROM "qti"."lom_general_title" AS "r5") AS "r6"("c7", "c8", "c9")) AS "r7"("c10", "c11", "c12")) AS "r8"("c13", "c14", "c15") GROUP BY "r8"."c14") AS "r9"("c16", "c17")) AS "r10"("c18", "c19") WHERE "r4"."c6" = "r10"."c18") AS "r11"("c20", "c21") WHERE "r11"."c21" < 1::bigint OR "r11"."c21" > 1::bigint) AS "r12"("c22", "c23")) AS "r13"("c24") UNION SELECT "r26"."c46" FROM (SELECT DISTINCT "r25"."c45" FROM (SELECT DISTINCT "r24"."c44" FROM (SELECT DISTINCT "r17"."c30" FROM (SELECT DISTINCT "r16"."c29" FROM (SELECT DISTINCT "r15"."c25" FROM (SELECT DISTINCT "r14"."lom", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."resource_lom_titled" AS "r14") AS "r15"("c25", "c26", "c27", "c28")) AS "r16"("c29")) AS "r17"("c30") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c40", "r22"."c41" FROM (SELECT "r21"."c38", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c34", "r20"."c35", "r20"."c36" FROM (SELECT DISTINCT "r19"."c31", "r19"."c32", "r19"."c33" FROM (SELECT DISTINCT "r18"."id", "r18"."lom", "r18"."owner" FROM "qti"."lom_general_title" AS "r18") AS "r19"("c31", "c32", "c33")) AS "r20"("c34", "c35", "c36")) AS "r21"("c37", "c38", "c39") GROUP BY "r21"."c38") AS "r22"("c40", "c41")) AS "r23"("c42", "c43") WHERE "r23"."c42" = "r17"."c30")) AS "r24"("c44") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c45")) AS "r26"("c46")) AS "r27"("c47")) THEN
    RAISE EXCEPTION 'law __resource_lom_titled_capacity_lom_general_title_vwt6bhndmk is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_titled_capacity_lom_general_title_vwt6bhndmk'::"pg_catalog"."text";
  END IF;
END
$$;
