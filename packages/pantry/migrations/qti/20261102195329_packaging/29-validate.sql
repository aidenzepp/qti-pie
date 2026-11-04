-- Validate law __statistic_kind_categorized_in_categorized_jfgum6mp2o: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."categorized_statistic_arm", "qti"."statistic" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_sfypheif7e"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'statistic'::text THEN
    IF NEW."kind" = 'categorized'::"qti"."statistic_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'categorized'::"qti"."statistic_kind" THEN
          PERFORM 1 FROM "qti"."categorized_statistic_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __statistic_kind_categorized_in_categorized_jfgum6mp2o violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__statistic_kind_categorized_in_categorized_jfgum6mp2o'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Statistic",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Statistic"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."statistic" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'categorized'::"qti"."statistic_kind" THEN
        PERFORM 1 FROM "qti"."categorized_statistic_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __statistic_kind_categorized_in_categorized_jfgum6mp2o violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__statistic_kind_categorized_in_categorized_jfgum6mp2o'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Statistic",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Statistic"]'::text END;
        END IF;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_sfypheif7e"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_in_categorized_2fgm3jzl2i"
  AFTER DELETE ON "qti"."categorized_statistic_arm"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_sfypheif7e"();

CREATE CONSTRAINT TRIGGER "__law_statistic_kind_categorized_in_categorized_ndyk4nqx7d"
  AFTER INSERT ON "qti"."statistic"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_statistic_kind_categorized_in_categorized_sfypheif7e"();

-- The full violation query of law __statistic_kind_categorized_in_categorized_jfgum6mp2o.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "id" FROM (SELECT DISTINCT "r4"."c8" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."context", "r1"."id", "r1"."kind", "r1"."name", "r1"."position", "r1"."usage_data" FROM "qti"."statistic" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c3" = 'categorized'::"qti"."statistic_kind") AS "r3"("c7")) AS "r4"("c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."id" FROM "qti"."categorized_statistic_arm" AS "r5") AS "r6"("c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c8")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __statistic_kind_categorized_in_categorized_jfgum6mp2o is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__statistic_kind_categorized_in_categorized_jfgum6mp2o'::text;
  END IF;
END
$$;
