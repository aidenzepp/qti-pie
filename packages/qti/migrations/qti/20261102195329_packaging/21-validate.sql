-- Validate law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."statistic", "qti"."usage_mapping" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_oxlzku67eo"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'statistic'::text THEN
    IF NEW."kind" = 'categorized'::"qti"."statistic_kind" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'categorized'::"qti"."statistic_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_mapping" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Statistic",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Statistic"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."statistic" LOOP
        IF "t"."c2" = 'categorized'::"qti"."statistic_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_mapping" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Statistic",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Statistic"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    ELSE
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = OLD."statistic" LOOP
        IF "t"."c2" = 'categorized'::"qti"."statistic_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."usage_mapping" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_mapping" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Statistic",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Statistic"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_oxlzku67eo"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_capacity_usage_s7xvqrkii7"
  AFTER INSERT ON "qti"."statistic"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_oxlzku67eo"();

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_capacity_usage_ybxodga5vn"
  AFTER INSERT OR DELETE ON "qti"."usage_mapping"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_capacity_usage_oxlzku67eo"();

-- The full violation query of law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c51" AS "id" FROM (SELECT "r13"."c26" FROM (SELECT DISTINCT "r12"."c24" FROM (SELECT DISTINCT "r11"."c22", "r11"."c23" FROM (SELECT DISTINCT "r4"."c8", "r10"."c21" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data" FROM "qti"."statistic" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c3" = 'categorized'::"qti"."statistic_kind") AS "r3"("c7")) AS "r4"("c8"), (SELECT DISTINCT "r9"."c18", "r9"."c19" FROM (SELECT "r8"."c17", count(*) FROM (SELECT DISTINCT "r7"."c12", "r7"."c13", "r7"."c14" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."default_value", "r5"."id", "r5"."statistic" FROM "qti"."usage_mapping" AS "r5") AS "r6"("c9", "c10", "c11")) AS "r7"("c12", "c13", "c14")) AS "r8"("c15", "c16", "c17") GROUP BY "r8"."c17") AS "r9"("c18", "c19")) AS "r10"("c20", "c21") WHERE "r4"."c8" = "r10"."c20") AS "r11"("c22", "c23") WHERE "r11"."c23" < 1::bigint OR "r11"."c23" > 1::bigint) AS "r12"("c24", "c25")) AS "r13"("c26") UNION SELECT "r26"."c50" FROM (SELECT DISTINCT "r25"."c49" FROM (SELECT DISTINCT "r24"."c48" FROM (SELECT DISTINCT "r17"."c34" FROM (SELECT DISTINCT "r16"."c33" FROM (SELECT DISTINCT "r15"."c28" FROM (SELECT DISTINCT "r14"."context", "r14"."id", "r14"."kind", "r14"."name", "r14"."position", "r14"."usage_data" FROM "qti"."statistic" AS "r14") AS "r15"("c27", "c28", "c29", "c30", "c31", "c32") WHERE "r15"."c29" = 'categorized'::"qti"."statistic_kind") AS "r16"("c33")) AS "r17"("c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c44", "r22"."c45" FROM (SELECT "r21"."c43", count(*) FROM (SELECT DISTINCT "r20"."c38", "r20"."c39", "r20"."c40" FROM (SELECT DISTINCT "r19"."c35", "r19"."c36", "r19"."c37" FROM (SELECT DISTINCT "r18"."default_value", "r18"."id", "r18"."statistic" FROM "qti"."usage_mapping" AS "r18") AS "r19"("c35", "c36", "c37")) AS "r20"("c38", "c39", "c40")) AS "r21"("c41", "c42", "c43") GROUP BY "r21"."c43") AS "r22"("c44", "c45")) AS "r23"("c46", "c47") WHERE "r23"."c46" = "r17"."c34")) AS "r24"("c48") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c49")) AS "r26"("c50")) AS "r27"("c51")) THEN
    RAISE EXCEPTION 'law __statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__statistic_kind_categorized_capacity_usage_mapping_nmo22qobc6'::text;
  END IF;
END
$$;
