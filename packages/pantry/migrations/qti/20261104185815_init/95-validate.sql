-- Validate law __declaration_kind_response_in_response_declaration_zn3c2yrkcl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declaration", "qti"."response_declaration_id" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_kind_response_in_response_bir6kphach"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."document" AS "c2", "r1"."identifier" AS "c3", "r1"."kind" AS "c4" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."document" = NEW."document" AND "r1"."identifier" = NEW."identifier" LOOP
    IF "p"."c4" = 'response'::"qti"."declaration_kind" THEN
      PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."node" = "p"."c1" AND "r1"."document" = "p"."c2" AND "r1"."id" = "p"."c3";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declaration_kind_response_in_response_declaration_zn3c2yrkcl violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__declaration_kind_response_in_response_declaration_zn3c2yrkcl'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Declaration",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Declaration"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_kind_response_in_response_bir6kphach"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_kind_response_in_response_i2lcxpfuae"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."document" AS "c2", "r1"."identifier" AS "c3", "r1"."kind" AS "c4" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."document" = OLD."document" AND "r1"."identifier" = OLD."id" LOOP
    IF "p"."c4" = 'response'::"qti"."declaration_kind" THEN
      PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."node" = "p"."c1" AND "r1"."document" = "p"."c2" AND "r1"."id" = "p"."c3";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declaration_kind_response_in_response_declaration_zn3c2yrkcl violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__declaration_kind_response_in_response_declaration_zn3c2yrkcl'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Declaration",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Declaration"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_kind_response_in_response_i2lcxpfuae"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declaration_kind_response_in_response_ftzxdy5ojm"
  AFTER INSERT ON "qti"."declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'response'::"qti"."declaration_kind")
  EXECUTE FUNCTION "qti"."__law_declaration_kind_response_in_response_bir6kphach"();

CREATE CONSTRAINT TRIGGER "__law_declaration_kind_response_in_response_g2t2vdtyei"
  AFTER DELETE ON "qti"."response_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_kind_response_in_response_i2lcxpfuae"();

-- The full violation query of law __declaration_kind_response_in_response_declaration_zn3c2yrkcl.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c21" AS "id", "r9"."c22" AS "document", "r9"."c23" AS "identifier" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10", "r4"."c11" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c2", "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape" FROM "qti"."declaration" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'response'::"qti"."declaration_kind") AS "r3"("c6", "c7", "c8")) AS "r4"("c9", "c10", "c11") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c15", "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c14", "r6"."c12", "r6"."c13" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."node" FROM "qti"."response_declaration_id" AS "r5") AS "r6"("c12", "c13", "c14")) AS "r7"("c15", "c16", "c17")) AS "r8"("c18", "c19", "c20") WHERE "r8"."c18" = "r4"."c9" AND "r8"."c19" = "r4"."c10" AND "r8"."c20" = "r4"."c11")) AS "r9"("c21", "c22", "c23")) THEN
    RAISE EXCEPTION 'law __declaration_kind_response_in_response_declaration_zn3c2yrkcl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__declaration_kind_response_in_response_declaration_zn3c2yrkcl'::"pg_catalog"."text";
  END IF;
END
$$;
