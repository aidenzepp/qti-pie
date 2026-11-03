-- Validate law __statistic_kind_ordinary_capacity_usage_value_oufq5rdqug: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."statistic", "qti"."usage_value" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_ordinary_capacity_usage_value_3onwnnq2vt"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'statistic'::text THEN
    IF NEW."kind" = 'ordinary'::"qti"."statistic_kind" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'ordinary'::"qti"."statistic_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."usage_value" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_value" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __statistic_kind_ordinary_capacity_usage_value_oufq5rdqug violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__statistic_kind_ordinary_capacity_usage_value_oufq5rdqug'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Statistic",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Statistic"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."statistic" LOOP
        IF "t"."c2" = 'ordinary'::"qti"."statistic_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."usage_value" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_value" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __statistic_kind_ordinary_capacity_usage_value_oufq5rdqug violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__statistic_kind_ordinary_capacity_usage_value_oufq5rdqug'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Statistic",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Statistic"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    ELSE
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = OLD."statistic" LOOP
        IF "t"."c2" = 'ordinary'::"qti"."statistic_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."usage_value" AS "r1" WHERE "r1"."statistic" = "t"."c1" GROUP BY "r1"."statistic") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."usage_value" AS "r3" WHERE "r3"."statistic" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __statistic_kind_ordinary_capacity_usage_value_oufq5rdqug violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__statistic_kind_ordinary_capacity_usage_value_oufq5rdqug'::text,
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_ordinary_capacity_usage_value_3onwnnq2vt"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_ordinary_capacity_usage_value_crlbzwchwi"
  AFTER INSERT ON "qti"."statistic"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_ordinary_capacity_usage_value_3onwnnq2vt"();

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_ordinary_capacity_usage_value_7kerdmoo6h"
  AFTER INSERT OR DELETE ON "qti"."usage_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_ordinary_capacity_usage_value_3onwnnq2vt"();

-- The full violation query of law __statistic_kind_ordinary_capacity_usage_value_oufq5rdqug.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c57" AS "id" FROM (SELECT "r13"."c29" FROM (SELECT DISTINCT "r12"."c27" FROM (SELECT DISTINCT "r11"."c25", "r11"."c26" FROM (SELECT DISTINCT "r4"."c8", "r10"."c24" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data" FROM "qti"."statistic" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c3" = 'ordinary'::"qti"."statistic_kind") AS "r3"("c7")) AS "r4"("c8"), (SELECT DISTINCT "r9"."c21", "r9"."c22" FROM (SELECT "r8"."c19", count(*) FROM (SELECT DISTINCT "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12" FROM (SELECT DISTINCT "r5"."collapsed", "r5"."id", "r5"."statistic", "r5"."value" FROM "qti"."usage_value" AS "r5") AS "r6"("c9", "c10", "c11", "c12")) AS "r7"("c13", "c14", "c15", "c16")) AS "r8"("c17", "c18", "c19", "c20") GROUP BY "r8"."c19") AS "r9"("c21", "c22")) AS "r10"("c23", "c24") WHERE "r4"."c8" = "r10"."c23") AS "r11"("c25", "c26") WHERE "r11"."c26" < 1::bigint OR "r11"."c26" > 1::bigint) AS "r12"("c27", "c28")) AS "r13"("c29") UNION SELECT "r26"."c56" FROM (SELECT DISTINCT "r25"."c55" FROM (SELECT DISTINCT "r24"."c54" FROM (SELECT DISTINCT "r17"."c37" FROM (SELECT DISTINCT "r16"."c36" FROM (SELECT DISTINCT "r15"."c31" FROM (SELECT DISTINCT "r14"."context", "r14"."id", "r14"."kind", "r14"."name", "r14"."position", "r14"."usage_data" FROM "qti"."statistic" AS "r14") AS "r15"("c30", "c31", "c32", "c33", "c34", "c35") WHERE "r15"."c32" = 'ordinary'::"qti"."statistic_kind") AS "r16"("c36")) AS "r17"("c37") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c50", "r22"."c51" FROM (SELECT "r21"."c48", count(*) FROM (SELECT DISTINCT "r20"."c42", "r20"."c43", "r20"."c44", "r20"."c45" FROM (SELECT DISTINCT "r19"."c38", "r19"."c39", "r19"."c40", "r19"."c41" FROM (SELECT DISTINCT "r18"."collapsed", "r18"."id", "r18"."statistic", "r18"."value" FROM "qti"."usage_value" AS "r18") AS "r19"("c38", "c39", "c40", "c41")) AS "r20"("c42", "c43", "c44", "c45")) AS "r21"("c46", "c47", "c48", "c49") GROUP BY "r21"."c48") AS "r22"("c50", "c51")) AS "r23"("c52", "c53") WHERE "r23"."c52" = "r17"."c37")) AS "r24"("c54") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c55")) AS "r26"("c56")) AS "r27"("c57")) THEN
    RAISE EXCEPTION 'law __statistic_kind_ordinary_capacity_usage_value_oufq5rdqug is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__statistic_kind_ordinary_capacity_usage_value_oufq5rdqug'::text;
  END IF;
END
$$;
