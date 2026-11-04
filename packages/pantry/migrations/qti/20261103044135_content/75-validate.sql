-- Validate law __declaration_kind_context_in_context_declaration_etjcstbhit: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."context_declaration_arm", "qti"."declaration" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declaration_kind_context_in_context_2wekelmbsl"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'declaration'::text THEN
    IF NEW."kind" = 'context'::"qti"."declaration_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'context'::"qti"."declaration_kind" THEN
          PERFORM 1 FROM "qti"."context_declaration_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __declaration_kind_context_in_context_declaration_etjcstbhit violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__declaration_kind_context_in_context_declaration_etjcstbhit'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Declaration",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Declaration"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."declaration" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'context'::"qti"."declaration_kind" THEN
        PERFORM 1 FROM "qti"."context_declaration_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __declaration_kind_context_in_context_declaration_etjcstbhit violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__declaration_kind_context_in_context_declaration_etjcstbhit'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Declaration",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Declaration"]'::text END;
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_declaration_kind_context_in_context_2wekelmbsl"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declaration_kind_context_in_context_e7ufplfml3"
  AFTER DELETE ON "qti"."context_declaration_arm"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_kind_context_in_context_2wekelmbsl"();

CREATE CONSTRAINT TRIGGER "__law_declaration_kind_context_in_context_sqwju4253q"
  AFTER INSERT ON "qti"."declaration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declaration_kind_context_in_context_2wekelmbsl"();

-- The full violation query of law __declaration_kind_context_in_context_declaration_etjcstbhit.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "id" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."identifier", "r1"."kind", "r1"."shape" FROM "qti"."declaration" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'context'::"qti"."declaration_kind") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."id", "r5"."version" FROM "qti"."context_declaration_arm" AS "r5") AS "r6"("c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c7")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __declaration_kind_context_in_context_declaration_etjcstbhit is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__declaration_kind_context_in_context_declaration_etjcstbhit'::text;
  END IF;
END
$$;
