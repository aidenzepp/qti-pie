-- Validate law __tree_kind_manifest_in_package_i47ndm2dke: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."package", "qti"."tree" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_tree_kind_manifest_in_package_soguk2tyu4"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'tree'::text THEN
    IF NEW."kind" = 'manifest'::"qti"."tree_kind" THEN
      PERFORM 1 FROM "qti"."package" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."schemaversion" = NEW."version";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."tree" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."version" = NEW."version" AND "r1"."kind" = 'manifest'::"qti"."tree_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __tree_kind_manifest_in_package_i47ndm2dke violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__tree_kind_manifest_in_package_i47ndm2dke'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Tree",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["Tree"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."package" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."schemaversion" = OLD."schemaversion";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."tree" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."version" = OLD."schemaversion" AND "r1"."kind" = 'manifest'::"qti"."tree_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __tree_kind_manifest_in_package_i47ndm2dke violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__tree_kind_manifest_in_package_i47ndm2dke'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Tree",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["Tree"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_tree_kind_manifest_in_package_soguk2tyu4"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_tree_kind_manifest_in_package_uhhfalo2z7"
  AFTER DELETE ON "qti"."package"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_tree_kind_manifest_in_package_soguk2tyu4"();

CREATE CONSTRAINT TRIGGER "__law_tree_kind_manifest_in_package_j3dyqr7eb5"
  AFTER INSERT ON "qti"."tree"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_tree_kind_manifest_in_package_soguk2tyu4"();

-- The full violation query of law __tree_kind_manifest_in_package_i47ndm2dke.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c17" AS "id", "r9"."c18" AS "version" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c2", "r2"."c5" FROM (SELECT DISTINCT "r1"."charset", "r1"."id", "r1"."kind", "r1"."root", "r1"."version" FROM "qti"."tree" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c3" = 'manifest'::"qti"."tree_kind") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13", "r7"."c14" FROM (SELECT DISTINCT "r6"."c10", "r6"."c12" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."schemaversion" FROM "qti"."package" AS "r5") AS "r6"("c10", "c11", "c12")) AS "r7"("c13", "c14")) AS "r8"("c15", "c16") WHERE "r8"."c15" = "r4"."c8" AND "r8"."c16" = "r4"."c9")) AS "r9"("c17", "c18")) THEN
    RAISE EXCEPTION 'law __tree_kind_manifest_in_package_i47ndm2dke is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__tree_kind_manifest_in_package_i47ndm2dke'::text;
  END IF;
END
$$;
