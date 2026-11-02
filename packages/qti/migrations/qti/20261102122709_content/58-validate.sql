-- Validate law __lom_language_owner_resource_in_resource_lom_vttotzck4r: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_language", "qti"."resource_lom_language_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_language_owner_resource_in_resource_lom_nrlhaonldh"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'lom_language'::text THEN
    IF NEW."owner" = 'resource'::"qti"."lom_owner" THEN
      PERFORM 1 FROM "qti"."resource_lom_language_set" AS "r1" WHERE "r1"."lom" = NEW."lom" AND "r1"."value" = NEW."value";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_language" AS "r1" WHERE "r1"."lom" = NEW."lom" AND "r1"."value" = NEW."value" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __lom_language_owner_resource_in_resource_lom_vttotzck4r violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__lom_language_owner_resource_in_resource_lom_vttotzck4r'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["LomLanguage",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["LomLanguage"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."resource_lom_language_set" AS "r1" WHERE "r1"."lom" = OLD."lom" AND "r1"."value" = OLD."value";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_language" AS "r1" WHERE "r1"."lom" = OLD."lom" AND "r1"."value" = OLD."value" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __lom_language_owner_resource_in_resource_lom_vttotzck4r violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__lom_language_owner_resource_in_resource_lom_vttotzck4r'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["LomLanguage",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["LomLanguage"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_language_owner_resource_in_resource_lom_nrlhaonldh"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_lom_language_owner_resource_in_resource_lom_7xxurk7goe"
  AFTER INSERT ON "qti"."lom_language"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_language_owner_resource_in_resource_lom_nrlhaonldh"();

CREATE CONSTRAINT TRIGGER "__law_lom_language_owner_resource_in_resource_lom_ppwv6rby2g"
  AFTER DELETE ON "qti"."resource_lom_language_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_language_owner_resource_in_resource_lom_nrlhaonldh"();

-- The full violation query of law __lom_language_owner_resource_in_resource_lom_vttotzck4r.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c18" AS "lom", "r9"."c19" AS "value" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c2", "r2"."c5" FROM (SELECT DISTINCT "r1"."id", "r1"."lom", "r1"."owner", "r1"."position", "r1"."value" FROM "qti"."lom_language" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c3" = 'resource'::"qti"."lom_owner") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c10", "r6"."c13" FROM (SELECT DISTINCT "r5"."lom", "r5"."package", "r5"."resource", "r5"."value" FROM "qti"."resource_lom_language_set" AS "r5") AS "r6"("c10", "c11", "c12", "c13")) AS "r7"("c14", "c15")) AS "r8"("c16", "c17") WHERE "r8"."c16" = "r4"."c8" AND "r8"."c17" = "r4"."c9")) AS "r9"("c18", "c19")) THEN
    RAISE EXCEPTION 'law __lom_language_owner_resource_in_resource_lom_vttotzck4r is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__lom_language_owner_resource_in_resource_lom_vttotzck4r'::text;
  END IF;
END
$$;
