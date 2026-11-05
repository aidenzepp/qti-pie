-- Validate law __declaration_shape_alternatives_qyjajgu3a6: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declaration", "qti"."record_declaration", "qti"."typed_declaration" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_shape_alternatives_g72wdeuayl"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'typed'::"qti"."declaration_shape" THEN
        PERFORM 1 FROM "qti"."typed_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Declaration",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Declaration"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'record'::"qti"."declaration_shape" THEN
        PERFORM 1 FROM "qti"."record_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Declaration",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Declaration"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_shape_alternatives_g72wdeuayl"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_shape_alternatives_3djon54e7w"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'record'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."record_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Declaration",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Declaration"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_shape_alternatives_3djon54e7w"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_shape_alternatives_62zgv23k7o"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'typed'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."typed_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Declaration",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Declaration"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_shape_alternatives_62zgv23k7o"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declaration_shape_alternatives_yk55zegfmc"
  AFTER INSERT ON "qti"."declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_shape_alternatives_g72wdeuayl"();

CREATE CONSTRAINT TRIGGER "__law_declaration_shape_alternatives_vju3ruyolr"
  AFTER DELETE ON "qti"."record_declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_shape_alternatives_3djon54e7w"();

CREATE CONSTRAINT TRIGGER "__law_declaration_shape_alternatives_fiyepja5lg"
  AFTER DELETE ON "qti"."typed_declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_shape_alternatives_62zgv23k7o"();

-- The full violation query of law __declaration_shape_alternatives_qyjajgu3a6.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c28" AS "id" FROM (SELECT "r9"."c16" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape" FROM "qti"."declaration" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = 'typed'::"qti"."declaration_shape") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14" FROM (SELECT DISTINCT "r6"."c11" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."document", "r5"."id", "r5"."identifier", "r5"."kind" FROM "qti"."typed_declaration" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12", "c13")) AS "r7"("c14")) AS "r8"("c15") WHERE "r8"."c15" = "r4"."c7")) AS "r9"("c16") UNION SELECT "r18"."c27" FROM (SELECT DISTINCT "r13"."c23" FROM (SELECT DISTINCT "r12"."c22" FROM (SELECT DISTINCT "r11"."c18" FROM (SELECT DISTINCT "r10"."document", "r10"."id", "r10"."identifier", "r10"."kind", "r10"."shape" FROM "qti"."declaration" AS "r10") AS "r11"("c17", "c18", "c19", "c20", "c21") WHERE "r11"."c21" = 'record'::"qti"."declaration_shape") AS "r12"("c22")) AS "r13"("c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c25" FROM (SELECT DISTINCT "r15"."c24" FROM (SELECT DISTINCT "r14"."id" FROM "qti"."record_declaration" AS "r14") AS "r15"("c24")) AS "r16"("c25")) AS "r17"("c26") WHERE "r17"."c26" = "r13"."c23")) AS "r18"("c27")) AS "r19"("c28")) THEN
    RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::"pg_catalog"."text";
  END IF;
END
$$;
