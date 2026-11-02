-- Validate law __document_id_holder_alternatives_pwzd7tub5c: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document_id", "qti"."response_declaration_id" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'document_id'::text THEN
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = NEW."document" AND "r1"."id" = NEW."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."document" AS "c1", "r1"."id" AS "c2", "r1"."holder" AS "c3" FROM "qti"."document_id" AS "r1" WHERE "r1"."document" = OLD."document" AND "r1"."id" = OLD."id" LOOP
      CASE "p"."c3"
        WHEN 'responseDeclaration'::"qti"."id_holder" THEN
          PERFORM 1 FROM "qti"."response_declaration_id" AS "r1" WHERE "r1"."document" = "p"."c1" AND "r1"."id" = "p"."c2";
      END CASE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DocumentId",'::text || to_jsonb("p"."c1"::text)::text || ','::text || to_jsonb("p"."c2"::text)::text || ']'::text ELSE 'w["DocumentId"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_xredhbipsh"
  AFTER INSERT ON "qti"."document_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

CREATE CONSTRAINT TRIGGER "__law_document_id_holder_alternatives_hewcediiwx"
  AFTER DELETE ON "qti"."response_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_id_holder_alternatives_tvkrdcw3po"();

-- The full violation query of law __document_id_holder_alternatives_pwzd7tub5c.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c15" AS "document", "r9"."c16" AS "id" FROM (SELECT DISTINCT "r4"."c6", "r4"."c7" FROM (SELECT DISTINCT "r3"."c4", "r3"."c5" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."holder", "r1"."id" FROM "qti"."document_id" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'responseDeclaration'::"qti"."id_holder") AS "r3"("c4", "c5")) AS "r4"("c6", "c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."node" FROM "qti"."response_declaration_id" AS "r5") AS "r6"("c8", "c9", "c10")) AS "r7"("c11", "c12")) AS "r8"("c13", "c14") WHERE "r8"."c13" = "r4"."c6" AND "r8"."c14" = "r4"."c7")) AS "r9"("c15", "c16")) THEN
    RAISE EXCEPTION 'law __document_id_holder_alternatives_pwzd7tub5c is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__document_id_holder_alternatives_pwzd7tub5c'::text;
  END IF;
END
$$;
