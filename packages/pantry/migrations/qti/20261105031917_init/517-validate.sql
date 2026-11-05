-- Validate law __usage_mapping_capacity_usage_map_entry_fzfmcipt3h: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."usage_map_entry", "qti"."usage_mapping" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_curuxkupcc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."id" = OLD."mapping" LOOP
    PERFORM 1 FROM "qti"."usage_map_entry" AS "r1" WHERE "r1"."mapping" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __usage_mapping_capacity_usage_map_entry_fzfmcipt3h violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__usage_mapping_capacity_usage_map_entry_fzfmcipt3h'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageMapping",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageMapping"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_curuxkupcc"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_am22phungp"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."usage_map_entry" AS "r1" WHERE "r1"."mapping" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __usage_mapping_capacity_usage_map_entry_fzfmcipt3h violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__usage_mapping_capacity_usage_map_entry_fzfmcipt3h'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageMapping",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageMapping"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_am22phungp"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_usage_mapping_capacity_usage_map_entry_aixiqgl7pi"
  AFTER DELETE ON "qti"."usage_map_entry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_curuxkupcc"();

CREATE CONSTRAINT TRIGGER "__law_usage_mapping_capacity_usage_map_entry_q574bdmaly"
  AFTER INSERT ON "qti"."usage_mapping"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_mapping_capacity_usage_map_entry_am22phungp"();

-- The full violation query of law __usage_mapping_capacity_usage_map_entry_fzfmcipt3h.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c57" AS "id" FROM (SELECT "r13"."c29" FROM (SELECT DISTINCT "r12"."c27" FROM (SELECT DISTINCT "r11"."c25", "r11"."c26" FROM (SELECT DISTINCT "r4"."c5", "r10"."c24" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."default_value", "r1"."id", "r1"."statistic" FROM "qti"."usage_mapping" AS "r1") AS "r2"("c1", "c2", "c3")) AS "r3"("c4")) AS "r4"("c5"), (SELECT DISTINCT "r9"."c21", "r9"."c22" FROM (SELECT "r8"."c19", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c11", "r7"."c12", "r7"."c13", "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c6", "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."map_key", "r5"."mapped_value", "r5"."mapping", "r5"."position" FROM "qti"."usage_map_entry" AS "r5") AS "r6"("c6", "c7", "c8", "c9", "c10")) AS "r7"("c11", "c12", "c13", "c14", "c15")) AS "r8"("c16", "c17", "c18", "c19", "c20") GROUP BY "r8"."c19") AS "r9"("c21", "c22")) AS "r10"("c23", "c24") WHERE "r4"."c5" = "r10"."c23") AS "r11"("c25", "c26") WHERE "r11"."c26" < 1::bigint) AS "r12"("c27", "c28")) AS "r13"("c29") UNION SELECT "r26"."c56" FROM (SELECT DISTINCT "r25"."c55" FROM (SELECT DISTINCT "r24"."c54" FROM (SELECT DISTINCT "r17"."c34" FROM (SELECT DISTINCT "r16"."c33" FROM (SELECT DISTINCT "r15"."c31" FROM (SELECT DISTINCT "r14"."default_value", "r14"."id", "r14"."statistic" FROM "qti"."usage_mapping" AS "r14") AS "r15"("c30", "c31", "c32")) AS "r16"("c33")) AS "r17"("c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c50", "r22"."c51" FROM (SELECT "r21"."c48", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c40", "r20"."c41", "r20"."c42", "r20"."c43", "r20"."c44" FROM (SELECT DISTINCT "r19"."c35", "r19"."c36", "r19"."c37", "r19"."c38", "r19"."c39" FROM (SELECT DISTINCT "r18"."id", "r18"."map_key", "r18"."mapped_value", "r18"."mapping", "r18"."position" FROM "qti"."usage_map_entry" AS "r18") AS "r19"("c35", "c36", "c37", "c38", "c39")) AS "r20"("c40", "c41", "c42", "c43", "c44")) AS "r21"("c45", "c46", "c47", "c48", "c49") GROUP BY "r21"."c48") AS "r22"("c50", "c51")) AS "r23"("c52", "c53") WHERE "r23"."c52" = "r17"."c34")) AS "r24"("c54") WHERE 0::bigint < 1::bigint) AS "r25"("c55")) AS "r26"("c56")) AS "r27"("c57")) THEN
    RAISE EXCEPTION 'law __usage_mapping_capacity_usage_map_entry_fzfmcipt3h is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__usage_mapping_capacity_usage_map_entry_fzfmcipt3h'::"pg_catalog"."text";
  END IF;
END
$$;
