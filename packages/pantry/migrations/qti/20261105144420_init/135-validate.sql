-- Validate law __document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document_lang", "qti"."resource_lom_general" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_xcsiibf56g"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."resource_lom_general" AS "r1" WHERE "r1"."package" = NEW."package" AND "r1"."resource" = NEW."resource";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."document" AS "c1", "r1"."value" AS "c2" FROM "qti"."document_lang" AS "r1" WHERE "r1"."package" = NEW."package" AND "r1"."resource" = NEW."resource" AND "r1"."lom_general" = 'yes'::"qti"."yes_no" ORDER BY "r1"."document", "r1"."value" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentLang",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentLang"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_xcsiibf56g"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_cr4uj3jktp"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."resource_lom_general" AS "r1" WHERE "r1"."package" = OLD."package" AND "r1"."resource" = OLD."resource";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."document" AS "c1", "r1"."value" AS "c2" FROM "qti"."document_lang" AS "r1" WHERE "r1"."package" = OLD."package" AND "r1"."resource" = OLD."resource" AND "r1"."lom_general" = 'yes'::"qti"."yes_no" ORDER BY "r1"."document", "r1"."value" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DocumentLang",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DocumentLang"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_cr4uj3jktp"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_lang_lom_general_yes_in_resource_lom_jkiuxse6yf"
  AFTER INSERT ON "qti"."document_lang"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."lom_general" = 'yes'::"qti"."yes_no")
  EXECUTE FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_xcsiibf56g"();

CREATE CONSTRAINT TRIGGER "__law_document_lang_lom_general_yes_in_resource_lom_vhjlglz23q"
  AFTER DELETE ON "qti"."resource_lom_general"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_lang_lom_general_yes_in_resource_lom_cr4uj3jktp"();

-- The full violation query of law __document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c17" AS "package", "r9"."c18" AS "resource" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7"::"qti"."__text_rhdrzkabze" FROM (SELECT DISTINCT "r2"."c3", "r2"."c4" FROM (SELECT DISTINCT "r1"."document", "r1"."lom_general", "r1"."package", "r1"."resource", "r1"."value" FROM "qti"."document_lang" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c2" = 'yes'::"qti"."yes_no") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13", "r7"."c14"::"qti"."__text_rhdrzkabze" FROM (SELECT DISTINCT "r6"."c11", "r6"."c12" FROM (SELECT DISTINCT "r5"."lom", "r5"."package", "r5"."resource" FROM "qti"."resource_lom_general" AS "r5") AS "r6"("c10", "c11", "c12")) AS "r7"("c13", "c14")) AS "r8"("c15", "c16") WHERE "r8"."c15" = "r4"."c8" AND "r8"."c16" = "r4"."c9")) AS "r9"("c17", "c18")) THEN
    RAISE EXCEPTION 'law __document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__document_lang_lom_general_yes_in_resource_lom_pavmv6b7yu'::"pg_catalog"."text";
  END IF;
END
$$;
