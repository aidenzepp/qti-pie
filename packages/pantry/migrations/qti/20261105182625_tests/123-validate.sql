-- Validate law __prefixed_variable_source_ref_kind_section_variable_ojs432wxxl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."prefixed_variable_source", "qti"."section_variable_prefixed" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_xcecxexewu"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."ref_kind" AS "c3" FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = NEW."ref" AND "r1"."test" = NEW."test" LOOP
    IF "p"."c3" = 'sectionVariable'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."section_variable_prefixed" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __prefixed_variable_source_ref_kind_section_variable_ojs432wxxl violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__prefixed_variable_source_ref_kind_section_variable_ojs432wxxl'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_xcecxexewu"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_ddm6omh3fc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."ref_kind" AS "c3" FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'sectionVariable'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."section_variable_prefixed" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __prefixed_variable_source_ref_kind_section_variable_ojs432wxxl violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__prefixed_variable_source_ref_kind_section_variable_ojs432wxxl'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_ddm6omh3fc"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_prefixed_variable_source_ref_kind_section_7afdxnlc63"
  AFTER INSERT ON "qti"."prefixed_variable_source"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."ref_kind" = 'sectionVariable'::"qti"."ref_kind")
  EXECUTE FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_xcecxexewu"();

CREATE CONSTRAINT TRIGGER "__law_prefixed_variable_source_ref_kind_section_walvvtgovg"
  AFTER DELETE ON "qti"."section_variable_prefixed"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_prefixed_variable_source_ref_kind_section_ddm6omh3fc"();

-- The full violation query of law __prefixed_variable_source_ref_kind_section_variable_ojs432wxxl.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c19" AS "ref", "r9"."c20" AS "test" FROM (SELECT DISTINCT "r4"."c11", "r4"."c12" FROM (SELECT DISTINCT "r3"."c9", "r3"."c10" FROM (SELECT DISTINCT "r2"."c5", "r2"."c8" FROM (SELECT DISTINCT "r1"."document", "r1"."item_document", "r1"."item_ref", "r1"."prefix", "r1"."ref", "r1"."ref_kind", "r1"."source", "r1"."test" FROM "qti"."prefixed_variable_source" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8") WHERE "r2"."c6" = 'sectionVariable'::"qti"."ref_kind") AS "r3"("c9", "c10")) AS "r4"("c11", "c12") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."ref", "r5"."test" FROM "qti"."section_variable_prefixed" AS "r5") AS "r6"("c13", "c14")) AS "r7"("c15", "c16")) AS "r8"("c17", "c18") WHERE "r8"."c17" = "r4"."c11" AND "r8"."c18" = "r4"."c12")) AS "r9"("c19", "c20")) THEN
    RAISE EXCEPTION 'law __prefixed_variable_source_ref_kind_section_variable_ojs432wxxl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__prefixed_variable_source_ref_kind_section_variable_ojs432wxxl'::"pg_catalog"."text";
  END IF;
END
$$;
