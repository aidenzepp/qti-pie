-- Validate law __resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_object_title", "qti"."resource_lom_titled" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_z4szzkksqs"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = OLD."lom" LOOP
    IF "t"."c2" = 'imsqti_test_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_title" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_title" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_z4szzkksqs"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_xwwfjwmxk7"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    IF "t"."c2" = 'imsqti_test_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_title" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_title" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_xwwfjwmxk7"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_msrdj2utt4"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    IF "t"."c2" = 'imsqti_test_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_title" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_title" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_msrdj2utt4"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_6hip4laip7"
  AFTER DELETE ON "qti"."lom_object_title"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_z4szzkksqs"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_lpa6jlu6oy"
  AFTER INSERT ON "qti"."lom_object_title"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_xwwfjwmxk7"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_k5iyw27oj4"
  AFTER INSERT ON "qti"."resource_lom_titled"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."type" = 'imsqti_test_xmlv3p0'::"pg_catalog"."text")
  EXECUTE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_test_xmlv_3_p_msrdj2utt4"();

-- The full violation query of law __resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c43" AS "lom" FROM (WITH "r4"("c6") AS MATERIALIZED (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_titled" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'imsqti_test_xmlv3p0'::"pg_catalog"."text") AS "r3"("c5")), "r12"("c28", "c29") AS MATERIALIZED (SELECT DISTINCT "r11"."c26", "r11"."c27" FROM (SELECT "r10"."c21", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c14", "r9"."c15", "r9"."c16", "r9"."c17", "r9"."c18", "r9"."c19" FROM (SELECT DISTINCT "r8"."c8", "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13" FROM (SELECT DISTINCT "r7"."collapsed", "r7"."lom", "r7"."package", "r7"."position", "r7"."resource", "r7"."type" FROM "qti"."lom_object_title" AS "r7") AS "r8"("c8", "c9", "c10", "c11", "c12", "c13")) AS "r9"("c14", "c15", "c16", "c17", "c18", "c19")) AS "r10"("c20", "c21", "c22", "c23", "c24", "c25") GROUP BY "r10"."c21") AS "r11"("c26", "c27")) SELECT "r17"."c36" FROM (SELECT DISTINCT "r16"."c34" FROM (SELECT DISTINCT "r15"."c32", "r15"."c33" FROM (SELECT DISTINCT "r6"."c7", "r14"."c31" FROM (SELECT "r5"."c6" FROM "r4" AS "r5") AS "r6"("c7"), (SELECT "r13"."c28", "r13"."c29" FROM "r12" AS "r13") AS "r14"("c30", "c31") WHERE "r6"."c7" = "r14"."c30") AS "r15"("c32", "c33") WHERE "r15"."c33" < 1::bigint OR "r15"."c33" > 1::bigint) AS "r16"("c34", "c35")) AS "r17"("c36") UNION SELECT "r24"."c42" FROM (SELECT DISTINCT "r23"."c41" FROM (SELECT DISTINCT "r22"."c40" FROM (SELECT DISTINCT "r19"."c37" FROM (SELECT "r18"."c6" FROM "r4" AS "r18") AS "r19"("c37") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c28", "r20"."c29" FROM "r12" AS "r20") AS "r21"("c38", "c39") WHERE "r21"."c38" = "r19"."c37")) AS "r22"("c40") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c41")) AS "r24"("c42")) AS "r25"("c43")) THEN
    RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_titled_type_imsqti_test_xmlv_3_p_0_kgsewfgezn'::"pg_catalog"."text";
  END IF;
END
$$;
