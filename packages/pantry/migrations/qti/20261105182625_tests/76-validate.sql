-- Validate law __node_xml_lang_root_kind_test_in_document_lang_htlssd4myx: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document_lang", "qti"."node_xml_lang" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bd6josusiu"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."document_lang" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."value" = OLD."value";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."node_xml_lang" AS "r1" WHERE "r1"."tree" = OLD."document" AND "r1"."value" = OLD."value" AND "r1"."root_kind" = 'test'::"qti"."root_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __node_xml_lang_root_kind_test_in_document_lang_htlssd4myx violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__node_xml_lang_root_kind_test_in_document_lang_htlssd4myx'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["NodeXmlLang",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["NodeXmlLang"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bd6josusiu"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bnwoqkqv52"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."document_lang" AS "r1" WHERE "r1"."document" = NEW."tree" AND "r1"."value" = NEW."value";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."node_xml_lang" AS "r1" WHERE "r1"."tree" = NEW."tree" AND "r1"."value" = NEW."value" AND "r1"."root_kind" = 'test'::"qti"."root_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __node_xml_lang_root_kind_test_in_document_lang_htlssd4myx violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__node_xml_lang_root_kind_test_in_document_lang_htlssd4myx'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["NodeXmlLang",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["NodeXmlLang"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bnwoqkqv52"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_xml_lang_root_kind_test_in_document_lang_43gyyaa6as"
  AFTER DELETE ON "qti"."document_lang"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bd6josusiu"();

CREATE CONSTRAINT TRIGGER "__law_node_xml_lang_root_kind_test_in_document_lang_k7v3f22dti"
  AFTER INSERT ON "qti"."node_xml_lang"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root_kind" = 'test'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_node_xml_lang_root_kind_test_in_document_lang_bnwoqkqv52"();

-- The full violation query of law __node_xml_lang_root_kind_test_in_document_lang_htlssd4myx.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c20" AS "tree", "r9"."c21" AS "value" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10" FROM (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c5", "r2"."c6" FROM (SELECT DISTINCT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."root_kind", "r1"."tree", "r1"."value" FROM "qti"."node_xml_lang" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c4" = 'test'::"qti"."root_kind") AS "r3"("c7", "c8")) AS "r4"("c9", "c10") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c11", "r6"."c15" FROM (SELECT DISTINCT "r5"."document", "r5"."lom_general", "r5"."package", "r5"."resource", "r5"."value" FROM "qti"."document_lang" AS "r5") AS "r6"("c11", "c12", "c13", "c14", "c15")) AS "r7"("c16", "c17")) AS "r8"("c18", "c19") WHERE "r8"."c18" = "r4"."c9" AND "r8"."c19" = "r4"."c10")) AS "r9"("c20", "c21")) THEN
    RAISE EXCEPTION 'law __node_xml_lang_root_kind_test_in_document_lang_htlssd4myx is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_xml_lang_root_kind_test_in_document_lang_htlssd4myx'::"pg_catalog"."text";
  END IF;
END
$$;
