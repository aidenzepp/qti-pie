-- Validate law __resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_object_title", "qti"."resource_lom_titled" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_ixcgow5c5m"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = OLD."lom" LOOP
    IF "t"."c2" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_title" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_title" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_ixcgow5c5m"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_zqf73cs4fk"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    IF "t"."c2" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_title" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_title" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_zqf73cs4fk"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_aypqgr6net"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."lom" AS "c1", "r1"."type" AS "c2" FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
    IF "t"."c2" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."lom_object_title" AS "r1" WHERE "r1"."lom" = "t"."c1" GROUP BY "r1"."lom") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."lom_object_title" AS "r3" WHERE "r3"."lom" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResourceLomTitled",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResourceLomTitled"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_aypqgr6net"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_ohn3dzsoij"
  AFTER DELETE ON "qti"."lom_object_title"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_ixcgow5c5m"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_3534hzf5qr"
  AFTER INSERT ON "qti"."lom_object_title"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_zqf73cs4fk"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_b2zd4k2d47"
  AFTER INSERT ON "qti"."resource_lom_titled"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."type" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text")
  EXECUTE FUNCTION "qti"."__law_resource_lom_titled_type_imsqti_item_xmlv_3_p_aypqgr6net"();

-- The full violation query of law __resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c65" AS "lom" FROM (SELECT "r13"."c33" FROM (SELECT DISTINCT "r12"."c31" FROM (SELECT DISTINCT "r11"."c29", "r11"."c30" FROM (SELECT DISTINCT "r4"."c6", "r10"."c28" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_titled" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text") AS "r3"("c5")) AS "r4"("c6"), (SELECT DISTINCT "r9"."c25", "r9"."c26" FROM (SELECT "r8"."c20", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12" FROM (SELECT DISTINCT "r5"."collapsed", "r5"."lom", "r5"."package", "r5"."position", "r5"."resource", "r5"."type" FROM "qti"."lom_object_title" AS "r5") AS "r6"("c7", "c8", "c9", "c10", "c11", "c12")) AS "r7"("c13", "c14", "c15", "c16", "c17", "c18")) AS "r8"("c19", "c20", "c21", "c22", "c23", "c24") GROUP BY "r8"."c20") AS "r9"("c25", "c26")) AS "r10"("c27", "c28") WHERE "r4"."c6" = "r10"."c27") AS "r11"("c29", "c30") WHERE "r11"."c30" < 1::bigint OR "r11"."c30" > 1::bigint) AS "r12"("c31", "c32")) AS "r13"("c33") UNION SELECT "r26"."c64" FROM (SELECT DISTINCT "r25"."c63" FROM (SELECT DISTINCT "r24"."c62" FROM (SELECT DISTINCT "r17"."c39" FROM (SELECT DISTINCT "r16"."c38" FROM (SELECT DISTINCT "r15"."c34" FROM (SELECT DISTINCT "r14"."lom", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."resource_lom_titled" AS "r14") AS "r15"("c34", "c35", "c36", "c37") WHERE "r15"."c37" = 'imsqti_item_xmlv3p0'::"pg_catalog"."text") AS "r16"("c38")) AS "r17"("c39") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c58", "r22"."c59" FROM (SELECT "r21"."c53", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c46", "r20"."c47", "r20"."c48", "r20"."c49", "r20"."c50", "r20"."c51" FROM (SELECT DISTINCT "r19"."c40", "r19"."c41", "r19"."c42", "r19"."c43", "r19"."c44", "r19"."c45" FROM (SELECT DISTINCT "r18"."collapsed", "r18"."lom", "r18"."package", "r18"."position", "r18"."resource", "r18"."type" FROM "qti"."lom_object_title" AS "r18") AS "r19"("c40", "c41", "c42", "c43", "c44", "c45")) AS "r20"("c46", "c47", "c48", "c49", "c50", "c51")) AS "r21"("c52", "c53", "c54", "c55", "c56", "c57") GROUP BY "r21"."c53") AS "r22"("c58", "c59")) AS "r23"("c60", "c61") WHERE "r23"."c60" = "r17"."c39")) AS "r24"("c62") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c63")) AS "r26"("c64")) AS "r27"("c65")) THEN
    RAISE EXCEPTION 'law __resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__resource_lom_titled_type_imsqti_item_xmlv_3_p_0_ziueqr4cfu'::"pg_catalog"."text";
  END IF;
END
$$;
