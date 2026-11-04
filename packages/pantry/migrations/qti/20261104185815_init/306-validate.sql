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
  IF EXISTS (SELECT "r27"."c71" AS "lom" FROM (SELECT "r13"."c36" FROM (SELECT DISTINCT "r12"."c34" FROM (SELECT DISTINCT "r11"."c32", "r11"."c33" FROM (SELECT DISTINCT "r4"."c6", "r10"."c31" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_identified" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text") AS "r3"("c5")) AS "r4"("c6"), (SELECT DISTINCT "r9"."c28", "r9"."c29" FROM (SELECT "r8"."c23", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c14", "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18", "r7"."c19", "r7"."c20" FROM (SELECT DISTINCT "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13" FROM (SELECT DISTINCT "r5"."collapsed", "r5"."identifier", "r5"."lom", "r5"."package", "r5"."position", "r5"."resource", "r5"."type" FROM "qti"."lom_object_identifier" AS "r5") AS "r6"("c7", "c8", "c9", "c10", "c11", "c12", "c13")) AS "r7"("c14", "c15", "c16", "c17", "c18", "c19", "c20")) AS "r8"("c21", "c22", "c23", "c24", "c25", "c26", "c27") GROUP BY "r8"."c23") AS "r9"("c28", "c29")) AS "r10"("c30", "c31") WHERE "r4"."c6" = "r10"."c30") AS "r11"("c32", "c33") WHERE "r11"."c33" < 1::bigint OR "r11"."c33" > 1::bigint) AS "r12"("c34", "c35")) AS "r13"("c36") UNION SELECT "r26"."c70" FROM (SELECT DISTINCT "r25"."c69" FROM (SELECT DISTINCT "r24"."c68" FROM (SELECT DISTINCT "r17"."c42" FROM (SELECT DISTINCT "r16"."c41" FROM (SELECT DISTINCT "r15"."c37" FROM (SELECT DISTINCT "r14"."lom", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."resource_lom_identified" AS "r14") AS "r15"("c37", "c38", "c39", "c40") WHERE "r15"."c40" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text") AS "r16"("c41")) AS "r17"("c42") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c64", "r22"."c65" FROM (SELECT "r21"."c59", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c50", "r20"."c51", "r20"."c52", "r20"."c53", "r20"."c54", "r20"."c55", "r20"."c56" FROM (SELECT DISTINCT "r19"."c43", "r19"."c44", "r19"."c45", "r19"."c46", "r19"."c47", "r19"."c48", "r19"."c49" FROM (SELECT DISTINCT "r18"."collapsed", "r18"."identifier", "r18"."lom", "r18"."package", "r18"."position", "r18"."resource", "r18"."type" FROM "qti"."lom_object_identifier" AS "r18") AS "r19"("c43", "c44", "c45", "c46", "c47", "c48", "c49")) AS "r20"("c50", "c51", "c52", "c53", "c54", "c55", "c56")) AS "r21"("c57", "c58", "c59", "c60", "c61", "c62", "c63") GROUP BY "r21"."c59") AS "r22"("c64", "c65")) AS "r23"("c66", "c67") WHERE "r23"."c66" = "r17"."c42")) AS "r24"("c68") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c69")) AS "r26"("c70")) AS "r27"("c71")) THEN
    RAISE EXCEPTION 'law __resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_identified_type_imsqti_item_xmlv_3_p_i5xqx6pa6h'::"pg_catalog"."text";
  END IF;
END
$$;
