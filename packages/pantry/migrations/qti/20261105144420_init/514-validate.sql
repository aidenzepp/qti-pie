-- Validate law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."statistic", "qti"."usage_mapping" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_zgnpgbohl5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'categorized'::"qti"."statistic_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_mapping" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Statistic",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Statistic"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_zgnpgbohl5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_lo2ufutk2f"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = OLD."statistic" LOOP
    IF "t"."c2" = 'categorized'::"qti"."statistic_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_mapping" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Statistic",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Statistic"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_lo2ufutk2f"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_xpvwyg42it"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."statistic" LOOP
    IF "t"."c2" = 'categorized'::"qti"."statistic_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_mapping" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Statistic",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Statistic"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_xpvwyg42it"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_capacity_usage_g4seyri3vj"
  AFTER INSERT ON "qti"."statistic"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'categorized'::"qti"."statistic_kind")
  EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_zgnpgbohl5"();

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_capacity_usage_7j67x6cy5o"
  AFTER DELETE ON "qti"."usage_mapping"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_lo2ufutk2f"();

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_capacity_usage_urrhtssyuf"
  AFTER INSERT ON "qti"."usage_mapping"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_xpvwyg42it"();

-- The full violation query of law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c36" AS "id" FROM (WITH "r4"("c8") AS MATERIALIZED (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data" FROM "qti"."statistic" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c3" = 'categorized'::"qti"."statistic_kind") AS "r3"("c7")), "r12"("c21", "c22") AS MATERIALIZED (SELECT DISTINCT "r11"."c19", "r11"."c20" FROM (SELECT "r10"."c18", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c13", "r9"."c14", "r9"."c15" FROM (SELECT DISTINCT "r8"."c10", "r8"."c11", "r8"."c12" FROM (SELECT DISTINCT "r7"."default_value", "r7"."id", "r7"."statistic" FROM "qti"."usage_mapping" AS "r7") AS "r8"("c10", "c11", "c12")) AS "r9"("c13", "c14", "c15")) AS "r10"("c16", "c17", "c18") GROUP BY "r10"."c18") AS "r11"("c19", "c20")) SELECT "r17"."c29" FROM (SELECT DISTINCT "r16"."c27" FROM (SELECT DISTINCT "r15"."c25", "r15"."c26" FROM (SELECT DISTINCT "r6"."c9", "r14"."c24" FROM (SELECT "r5"."c8" FROM "r4" AS "r5") AS "r6"("c9"), (SELECT "r13"."c21", "r13"."c22" FROM "r12" AS "r13") AS "r14"("c23", "c24") WHERE "r6"."c9" = "r14"."c23") AS "r15"("c25", "c26") WHERE "r15"."c26" < 1::bigint OR "r15"."c26" > 1::bigint) AS "r16"("c27", "c28")) AS "r17"("c29") UNION SELECT "r24"."c35" FROM (SELECT DISTINCT "r23"."c34" FROM (SELECT DISTINCT "r22"."c33" FROM (SELECT DISTINCT "r19"."c30" FROM (SELECT "r18"."c8" FROM "r4" AS "r18") AS "r19"("c30") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c21", "r20"."c22" FROM "r12" AS "r20") AS "r21"("c31", "c32") WHERE "r21"."c31" = "r19"."c30")) AS "r22"("c33") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c34")) AS "r24"("c35")) AS "r25"("c36")) THEN
    RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::"pg_catalog"."text";
  END IF;
END
$$;
