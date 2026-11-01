-- Validate law __response_processing_root_kind_rptemplate_in_tree_k734gpsup6: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."response_processing", "qti"."tree_root" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_response_processing_root_kind_rptemplate_in_h7uvgdgfla"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'response_processing'::text THEN
    IF NEW."root_kind" = 'rptemplate'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."tree_root" AS "r1" WHERE "r1"."node" = NEW."id";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."response_processing" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."root_kind" = 'rptemplate'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __response_processing_root_kind_rptemplate_in_tree_k734gpsup6 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__response_processing_root_kind_rptemplate_in_tree_k734gpsup6'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ResponseProcessing",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["ResponseProcessing"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."tree_root" AS "r1" WHERE "r1"."node" = OLD."node";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."response_processing" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."root_kind" = 'rptemplate'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __response_processing_root_kind_rptemplate_in_tree_k734gpsup6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__response_processing_root_kind_rptemplate_in_tree_k734gpsup6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ResponseProcessing",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["ResponseProcessing"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_response_processing_root_kind_rptemplate_in_h7uvgdgfla"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_response_processing_root_kind_rptemplate_in_oz3pw5mqew"
  AFTER INSERT ON "qti"."response_processing"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_response_processing_root_kind_rptemplate_in_h7uvgdgfla"();

CREATE CONSTRAINT TRIGGER "__law_response_processing_root_kind_rptemplate_in_yndfez6sa4"
  AFTER DELETE ON "qti"."tree_root"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_response_processing_root_kind_rptemplate_in_h7uvgdgfla"();

-- The full violation query of law __response_processing_root_kind_rptemplate_in_tree_k734gpsup6.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c9" AS "id" FROM (SELECT DISTINCT "r4"."c4" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."root_kind" FROM "qti"."response_processing" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c2" = 'rptemplate'::"qti"."root_kind") AS "r3"("c3")) AS "r4"("c4") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c7" FROM (SELECT DISTINCT "r6"."c5" FROM (SELECT DISTINCT "r5"."node", "r5"."tree" FROM "qti"."tree_root" AS "r5") AS "r6"("c5", "c6")) AS "r7"("c7")) AS "r8"("c8") WHERE "r8"."c8" = "r4"."c4")) AS "r9"("c9")) THEN
    RAISE EXCEPTION 'law __response_processing_root_kind_rptemplate_in_tree_k734gpsup6 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__response_processing_root_kind_rptemplate_in_tree_k734gpsup6'::text;
  END IF;
END
$$;
