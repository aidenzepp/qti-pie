-- Validate law __resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_object_identifier", "qti"."resource_lom_identified" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_gxl6xrqmmq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = OLD."lom" LOOP
    IF "t"."c2" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_identifier" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_identifier" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomIdentified",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomIdentified"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_gxl6xrqmmq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_tch3s36eus"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    IF "t"."c2" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_identifier" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_identifier" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomIdentified",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomIdentified"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_tch3s36eus"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_c2mb2agp3p"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    IF "t"."c2" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_identifier" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_identifier" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomIdentified",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomIdentified"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_c2mb2agp3p"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_resource_lom_identified_type_imsqti_item_xmlv_qcqa2nqbfb"
  AFTER DELETE ON "qti"."lom_object_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_gxl6xrqmmq"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_identified_type_imsqti_item_xmlv_orjnyyn3re"
  AFTER INSERT ON "qti"."lom_object_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_tch3s36eus"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_identified_type_imsqti_item_xmlv_2m6qqjxts7"
  AFTER INSERT ON "qti"."resource_lom_identified"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."type" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text")
  EXECUTE FUNCTION "qti"."__law_resource_lom_identified_type_imsqti_item_xmlv_c2mb2agp3p"();

-- The full violation query of law __resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c46" AS "lom" FROM (WITH "r4"("c6") AS MATERIALIZED (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_identified" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text") AS "r3"("c5")), "r12"("c31", "c32") AS MATERIALIZED (SELECT DISTINCT "r11"."c29", "r11"."c30" FROM (SELECT "r10"."c24", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c15", "r9"."c16", "r9"."c17", "r9"."c18", "r9"."c19", "r9"."c20", "r9"."c21" FROM (SELECT DISTINCT "r8"."c8", "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13", "r8"."c14" FROM (SELECT DISTINCT "r7"."collapsed", "r7"."identifier", "r7"."lom", "r7"."package", "r7"."position", "r7"."resource", "r7"."type" FROM "qti"."lom_object_identifier" AS "r7") AS "r8"("c8", "c9", "c10", "c11", "c12", "c13", "c14")) AS "r9"("c15", "c16", "c17", "c18", "c19", "c20", "c21")) AS "r10"("c22", "c23", "c24", "c25", "c26", "c27", "c28") GROUP BY "r10"."c24") AS "r11"("c29", "c30")) SELECT "r17"."c39" FROM (SELECT DISTINCT "r16"."c37" FROM (SELECT DISTINCT "r15"."c35", "r15"."c36" FROM (SELECT DISTINCT "r6"."c7", "r14"."c34" FROM (SELECT "r5"."c6" FROM "r4" AS "r5") AS "r6"("c7"), (SELECT "r13"."c31", "r13"."c32" FROM "r12" AS "r13") AS "r14"("c33", "c34") WHERE "r6"."c7" = "r14"."c33") AS "r15"("c35", "c36") WHERE "r15"."c36" < 1::bigint OR "r15"."c36" > 1::bigint) AS "r16"("c37", "c38")) AS "r17"("c39") UNION SELECT "r24"."c45" FROM (SELECT DISTINCT "r23"."c44" FROM (SELECT DISTINCT "r22"."c43" FROM (SELECT DISTINCT "r19"."c40" FROM (SELECT "r18"."c6" FROM "r4" AS "r18") AS "r19"("c40") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c31", "r20"."c32" FROM "r12" AS "r20") AS "r21"("c41", "c42") WHERE "r21"."c41" = "r19"."c40")) AS "r22"("c43") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c44")) AS "r24"("c45")) AS "r25"("c46")) THEN
    RAISE EXCEPTION 'law __resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h'::"pg_catalog"."text";
  END IF;
END
$$;
