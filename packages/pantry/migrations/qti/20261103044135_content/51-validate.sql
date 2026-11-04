-- Validate law __document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document_lang", "qti"."resource_lom_language_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_4dr3srrnaw"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'document_lang'::text THEN
    IF NEW."lom_general" = 'yes'::"qti"."yes_no" THEN
      PERFORM 1 FROM "qti"."resource_lom_language_set" AS "r1" WHERE "r1"."package" = NEW."package" AND "r1"."resource" = NEW."resource" AND "r1"."value" = NEW."value";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."document" AS "c1", "r1"."value" AS "c2" FROM "qti"."document_lang" AS "r1" WHERE "r1"."package" = NEW."package" AND "r1"."resource" = NEW."resource" AND "r1"."value" = NEW."value" AND "r1"."lom_general" = 'yes'::"qti"."yes_no" ORDER BY "r1"."document", "r1"."value" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentLang",'::text || to_jsonb("w"."c1"::text)::text || ','::text || to_jsonb("w"."c2"::text)::text || ']'::text ELSE 'w["DocumentLang"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."resource_lom_language_set" AS "r1" WHERE "r1"."package" = OLD."package" AND "r1"."resource" = OLD."resource" AND "r1"."value" = OLD."value";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."document" AS "c1", "r1"."value" AS "c2" FROM "qti"."document_lang" AS "r1" WHERE "r1"."package" = OLD."package" AND "r1"."resource" = OLD."resource" AND "r1"."value" = OLD."value" AND "r1"."lom_general" = 'yes'::"qti"."yes_no" ORDER BY "r1"."document", "r1"."value" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentLang",'::text || to_jsonb("w"."c1"::text)::text || ','::text || to_jsonb("w"."c2"::text)::text || ']'::text ELSE 'w["DocumentLang"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_4dr3srrnaw"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_lang_lom_general_yes_in_resource_lom_m7idn3zg2n"
  AFTER INSERT ON "qti"."document_lang"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_4dr3srrnaw"();

CREATE CONSTRAINT TRIGGER "__law_document_lang_lom_general_yes_in_resource_lom_potw4sjqac"
  AFTER DELETE ON "qti"."resource_lom_language_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_4dr3srrnaw"();

-- The full violation query of law __document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c22" AS "package", "r9"."c23" AS "resource", "r9"."c24" AS "value" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10", "r4"."c11" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7", "r3"."c8"::text FROM (SELECT DISTINCT "r2"."c3", "r2"."c4", "r2"."c5" FROM (SELECT DISTINCT "r1"."document", "r1"."lom_general", "r1"."package", "r1"."resource", "r1"."value" FROM "qti"."document_lang" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c2" = 'yes'::"qti"."yes_no") AS "r3"("c6", "c7", "c8")) AS "r4"("c9", "c10", "c11") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c16", "r7"."c17", "r7"."c18"::text FROM (SELECT DISTINCT "r6"."c13", "r6"."c14", "r6"."c15" FROM (SELECT DISTINCT "r5"."lom", "r5"."package", "r5"."resource", "r5"."value" FROM "qti"."resource_lom_language_set" AS "r5") AS "r6"("c12", "c13", "c14", "c15")) AS "r7"("c16", "c17", "c18")) AS "r8"("c19", "c20", "c21") WHERE "r8"."c19" = "r4"."c9" AND "r8"."c20" = "r4"."c10" AND "r8"."c21" = "r4"."c11")) AS "r9"("c22", "c23", "c24")) THEN
    RAISE EXCEPTION 'law __document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__document_lang_lom_general_yes_in_resource_lom_r7zqimbhzw'::text;
  END IF;
END
$$;
