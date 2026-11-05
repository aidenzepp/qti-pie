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
  IF EXISTS (SELECT "r25"."c34" AS "lom" FROM (WITH "r4"("c6") AS MATERIALIZED (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_titled" AS "r1") AS "r2"("c1", "c2", "c3", "c4")) AS "r3"("c5")), "r12"("c19", "c20") AS MATERIALIZED (SELECT DISTINCT "r11"."c17", "r11"."c18" FROM (SELECT "r10"."c15", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c11", "r9"."c12", "r9"."c13" FROM (SELECT DISTINCT "r8"."c8", "r8"."c9", "r8"."c10" FROM (SELECT DISTINCT "r7"."id", "r7"."lom", "r7"."owner" FROM "qti"."lom_general_title" AS "r7") AS "r8"("c8", "c9", "c10")) AS "r9"("c11", "c12", "c13")) AS "r10"("c14", "c15", "c16") GROUP BY "r10"."c15") AS "r11"("c17", "c18")) SELECT "r17"."c27" FROM (SELECT DISTINCT "r16"."c25" FROM (SELECT DISTINCT "r15"."c23", "r15"."c24" FROM (SELECT DISTINCT "r6"."c7", "r14"."c22" FROM (SELECT "r5"."c6" FROM "r4" AS "r5") AS "r6"("c7"), (SELECT "r13"."c19", "r13"."c20" FROM "r12" AS "r13") AS "r14"("c21", "c22") WHERE "r6"."c7" = "r14"."c21") AS "r15"("c23", "c24") WHERE "r15"."c24" < 1::bigint OR "r15"."c24" > 1::bigint) AS "r16"("c25", "c26")) AS "r17"("c27") UNION SELECT "r24"."c33" FROM (SELECT DISTINCT "r23"."c32" FROM (SELECT DISTINCT "r22"."c31" FROM (SELECT DISTINCT "r19"."c28" FROM (SELECT "r18"."c6" FROM "r4" AS "r18") AS "r19"("c28") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c19", "r20"."c20" FROM "r12" AS "r20") AS "r21"("c29", "c30") WHERE "r21"."c29" = "r19"."c28")) AS "r22"("c31") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c32")) AS "r24"("c33")) AS "r25"("c34")) THEN
    RAISE EXCEPTION 'law __resource_lom_titled_capacity_lom_general_title_vwt6bhndmk is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_titled_capacity_lom_general_title_vwt6bhndmk'::"pg_catalog"."text";
  END IF;
END
$$;
