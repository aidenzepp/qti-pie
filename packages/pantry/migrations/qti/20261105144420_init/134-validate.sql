-- Validate law __document_root_usagedata_in_usage_data_mdf7l3dzdb: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document", "qti"."usage_data" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_2ro5v7d7ix"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'usagedata'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."usage_data" AS "r1" WHERE "r1"."document" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_root_usagedata_in_usage_data_mdf7l3dzdb violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__document_root_usagedata_in_usage_data_mdf7l3dzdb'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_2ro5v7d7ix"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_nztz4qx6vw"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = OLD."document" LOOP
    IF "p"."c2" = 'usagedata'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."usage_data" AS "r1" WHERE "r1"."document" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_root_usagedata_in_usage_data_mdf7l3dzdb violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__document_root_usagedata_in_usage_data_mdf7l3dzdb'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_nztz4qx6vw"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_root_usagedata_in_usage_data_377ezo7pve"
  AFTER INSERT ON "qti"."document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'usagedata'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_2ro5v7d7ix"();

CREATE CONSTRAINT TRIGGER "__law_document_root_usagedata_in_usage_data_mewtpzerye"
  AFTER DELETE ON "qti"."usage_data"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_root_usagedata_in_usage_data_nztz4qx6vw"();

-- The full violation query of law __document_root_usagedata_in_usage_data_mdf7l3dzdb.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version" FROM "qti"."document" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'usagedata'::"qti"."root_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."document", "r5"."id" FROM "qti"."usage_data" AS "r5") AS "r6"("c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c9")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __document_root_usagedata_in_usage_data_mdf7l3dzdb is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__document_root_usagedata_in_usage_data_mdf7l3dzdb'::"pg_catalog"."text";
  END IF;
END
$$;
