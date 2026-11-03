-- Validate law __lom_language_owner_resource_parent_kind_lom_gl35cm5mp5: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_language", "qti"."resource_lom_language_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_language_owner_resource_parent_kind_lom_k2phyohjlh"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'lom_language'::text THEN
    IF NEW."owner" = 'resource'::"qti"."lom_owner" AND NEW."parent_kind" = 'lom:general'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."resource_lom_language_set" AS "r1" WHERE "r1"."lom" = NEW."lom" AND "r1"."value" = NEW."value";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_language" AS "r1" WHERE "r1"."lom" = NEW."lom" AND "r1"."value" = NEW."value" AND ("r1"."owner" = 'resource'::"qti"."lom_owner" AND "r1"."parent_kind" = 'lom:general'::"qti"."node_kind") ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __lom_language_owner_resource_parent_kind_lom_gl35cm5mp5 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__lom_language_owner_resource_parent_kind_lom_gl35cm5mp5'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["LomLanguage",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["LomLanguage"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."resource_lom_language_set" AS "r1" WHERE "r1"."lom" = OLD."lom" AND "r1"."value" = OLD."value";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_language" AS "r1" WHERE "r1"."lom" = OLD."lom" AND "r1"."value" = OLD."value" AND ("r1"."owner" = 'resource'::"qti"."lom_owner" AND "r1"."parent_kind" = 'lom:general'::"qti"."node_kind") ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __lom_language_owner_resource_parent_kind_lom_gl35cm5mp5 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__lom_language_owner_resource_parent_kind_lom_gl35cm5mp5'::text,
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_language_owner_resource_parent_kind_lom_k2phyohjlh"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_lom_language_owner_resource_parent_kind_lom_jivg74t5if"
  AFTER INSERT ON "qti"."lom_language"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_language_owner_resource_parent_kind_lom_k2phyohjlh"();

CREATE CONSTRAINT TRIGGER "__law_lom_language_owner_resource_parent_kind_lom_soveytar6m"
  AFTER DELETE ON "qti"."resource_lom_language_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_language_owner_resource_parent_kind_lom_k2phyohjlh"();

-- The full violation query of law __lom_language_owner_resource_parent_kind_lom_gl35cm5mp5.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c19" AS "lom", "r9"."c20" AS "value" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10" FROM (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c2", "r2"."c6" FROM (SELECT DISTINCT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent_kind", "r1"."position", "r1"."value" FROM "qti"."lom_language" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c3" = 'resource'::"qti"."lom_owner" AND "r2"."c4" = 'lom:general'::"qti"."node_kind") AS "r3"("c7", "c8")) AS "r4"("c9", "c10") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c11", "r6"."c14" FROM (SELECT DISTINCT "r5"."lom", "r5"."package", "r5"."resource", "r5"."value" FROM "qti"."resource_lom_language_set" AS "r5") AS "r6"("c11", "c12", "c13", "c14")) AS "r7"("c15", "c16")) AS "r8"("c17", "c18") WHERE "r8"."c17" = "r4"."c9" AND "r8"."c18" = "r4"."c10")) AS "r9"("c19", "c20")) THEN
    RAISE EXCEPTION 'law __lom_language_owner_resource_parent_kind_lom_gl35cm5mp5 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__lom_language_owner_resource_parent_kind_lom_gl35cm5mp5'::text;
  END IF;
END
$$;
