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
  IF EXISTS (SELECT "r25"."c39" AS "id" FROM (WITH "r4"("c5") AS MATERIALIZED (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."default_value", "r1"."id", "r1"."statistic" FROM "qti"."usage_mapping" AS "r1") AS "r2"("c1", "c2", "c3")) AS "r3"("c4")), "r12"("c24", "c25") AS MATERIALIZED (SELECT DISTINCT "r11"."c22", "r11"."c23" FROM (SELECT "r10"."c20", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c12", "r9"."c13", "r9"."c14", "r9"."c15", "r9"."c16" FROM (SELECT DISTINCT "r8"."c7", "r8"."c8", "r8"."c9", "r8"."c10", "r8"."c11" FROM (SELECT DISTINCT "r7"."id", "r7"."map_key", "r7"."mapped_value", "r7"."mapping", "r7"."position" FROM "qti"."usage_map_entry" AS "r7") AS "r8"("c7", "c8", "c9", "c10", "c11")) AS "r9"("c12", "c13", "c14", "c15", "c16")) AS "r10"("c17", "c18", "c19", "c20", "c21") GROUP BY "r10"."c20") AS "r11"("c22", "c23")) SELECT "r17"."c32" FROM (SELECT DISTINCT "r16"."c30" FROM (SELECT DISTINCT "r15"."c28", "r15"."c29" FROM (SELECT DISTINCT "r6"."c6", "r14"."c27" FROM (SELECT "r5"."c5" FROM "r4" AS "r5") AS "r6"("c6"), (SELECT "r13"."c24", "r13"."c25" FROM "r12" AS "r13") AS "r14"("c26", "c27") WHERE "r6"."c6" = "r14"."c26") AS "r15"("c28", "c29") WHERE "r15"."c29" < 1::bigint) AS "r16"("c30", "c31")) AS "r17"("c32") UNION SELECT "r24"."c38" FROM (SELECT DISTINCT "r23"."c37" FROM (SELECT DISTINCT "r22"."c36" FROM (SELECT DISTINCT "r19"."c33" FROM (SELECT "r18"."c5" FROM "r4" AS "r18") AS "r19"("c33") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c24", "r20"."c25" FROM "r12" AS "r20") AS "r21"("c34", "c35") WHERE "r21"."c34" = "r19"."c33")) AS "r22"("c36") WHERE 0::bigint < 1::bigint) AS "r23"("c37")) AS "r24"("c38")) AS "r25"("c39")) THEN
    RAISE EXCEPTION 'law __usage_mapping_capacity_usage_map_entry_fzfmcipt3h is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__usage_mapping_capacity_usage_map_entry_fzfmcipt3h'::"pg_catalog"."text";
  END IF;
END
$$;
