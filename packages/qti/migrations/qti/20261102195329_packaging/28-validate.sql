-- Validate law __document_root_usagedata_in_usage_data_mdf7l3dzdb: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document", "qti"."usage_data" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_cgqxhyrzys"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'document'::text THEN
    IF NEW."root" = 'usagedata'::"qti"."root_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'usagedata'::"qti"."root_kind" THEN
          PERFORM 1 FROM "qti"."usage_data" AS "r1" WHERE "r1"."document" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __document_root_usagedata_in_usage_data_mdf7l3dzdb violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__document_root_usagedata_in_usage_data_mdf7l3dzdb'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Document",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Document"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = OLD."document" LOOP
      IF "p"."c2" = 'usagedata'::"qti"."root_kind" THEN
        PERFORM 1 FROM "qti"."usage_data" AS "r1" WHERE "r1"."document" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __document_root_usagedata_in_usage_data_mdf7l3dzdb violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__document_root_usagedata_in_usage_data_mdf7l3dzdb'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Document",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Document"]'::text END;
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_cgqxhyrzys"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_root_usagedata_in_usage_data_kvqjkcrq2t"
  AFTER INSERT ON "qti"."document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_cgqxhyrzys"();

CREATE CONSTRAINT TRIGGER "__law_document_root_usagedata_in_usage_data_niakln7c6h"
  AFTER DELETE ON "qti"."usage_data"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_cgqxhyrzys"();

-- The full violation query of law __document_root_usagedata_in_usage_data_mdf7l3dzdb.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version" FROM "qti"."document" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'usagedata'::"qti"."root_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."document", "r5"."id" FROM "qti"."usage_data" AS "r5") AS "r6"("c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c9")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __document_root_usagedata_in_usage_data_mdf7l3dzdb is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__document_root_usagedata_in_usage_data_mdf7l3dzdb'::text;
  END IF;
END
$$;
