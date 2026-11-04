-- Validate law __declaration_shape_alternatives_qyjajgu3a6: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declaration", "qti"."record_declaration", "qti"."typed_declaration" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_shape_alternatives_ne4hwb3c7v"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'declaration'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Declaration",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Declaration"]'::text END;
      END IF;
    END LOOP;
  ELSIF TG_TABLE_NAME = 'typed_declaration'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Declaration",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Declaration"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'typed'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."typed_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_declaration" AS "r1" WHERE "r1"."id" = "p"."c1";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Declaration",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Declaration"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_shape_alternatives_ne4hwb3c7v"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declaration_shape_alternatives_gobp44zwso"
  AFTER INSERT ON "qti"."declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_shape_alternatives_ne4hwb3c7v"();

CREATE CONSTRAINT TRIGGER "__law_declaration_shape_alternatives_mej22q6oik"
  AFTER DELETE ON "qti"."record_declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_shape_alternatives_ne4hwb3c7v"();

CREATE CONSTRAINT TRIGGER "__law_declaration_shape_alternatives_db3qhpck3r"
  AFTER DELETE ON "qti"."typed_declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_shape_alternatives_ne4hwb3c7v"();

-- The full violation query of law __declaration_shape_alternatives_qyjajgu3a6.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c27" AS "id" FROM (SELECT "r9"."c15" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape" FROM "qti"."declaration" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = 'typed'::"qti"."declaration_shape") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13" FROM (SELECT DISTINCT "r6"."c11" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."document", "r5"."id", "r5"."identifier" FROM "qti"."typed_declaration" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12")) AS "r7"("c13")) AS "r8"("c14") WHERE "r8"."c14" = "r4"."c7")) AS "r9"("c15") UNION SELECT "r18"."c26" FROM (SELECT DISTINCT "r13"."c22" FROM (SELECT DISTINCT "r12"."c21" FROM (SELECT DISTINCT "r11"."c17" FROM (SELECT DISTINCT "r10"."document", "r10"."id", "r10"."identifier", "r10"."kind", "r10"."shape" FROM "qti"."declaration" AS "r10") AS "r11"("c16", "c17", "c18", "c19", "c20") WHERE "r11"."c20" = 'record'::"qti"."declaration_shape") AS "r12"("c21")) AS "r13"("c22") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c24" FROM (SELECT DISTINCT "r15"."c23" FROM (SELECT DISTINCT "r14"."id" FROM "qti"."record_declaration" AS "r14") AS "r15"("c23")) AS "r16"("c24")) AS "r17"("c25") WHERE "r17"."c25" = "r13"."c22")) AS "r18"("c26")) AS "r19"("c27")) THEN
    RAISE EXCEPTION 'law __declaration_shape_alternatives_qyjajgu3a6 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__declaration_shape_alternatives_qyjajgu3a6'::text;
  END IF;
END
$$;
