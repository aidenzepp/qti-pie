-- Validate law __node_kind_drd_access_for_all_resource_in_access_mwp3luyx53: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."access_for_all_resource", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_drd_access_for_all_resource_in_n42kxem2qa"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'node'::text THEN
    IF NEW."kind" = 'drd:accessForAllResource'::"qti"."node_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'drd:accessForAllResource'::"qti"."node_kind" THEN
          PERFORM 1 FROM "qti"."access_for_all_resource" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __node_kind_drd_access_for_all_resource_in_access_mwp3luyx53 violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__node_kind_drd_access_for_all_resource_in_access_mwp3luyx53'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'drd:accessForAllResource'::"qti"."node_kind" THEN
        PERFORM 1 FROM "qti"."access_for_all_resource" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __node_kind_drd_access_for_all_resource_in_access_mwp3luyx53 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__node_kind_drd_access_for_all_resource_in_access_mwp3luyx53'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_drd_access_for_all_resource_in_n42kxem2qa"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_drd_access_for_all_resource_in_oa442gwizq"
  AFTER DELETE ON "qti"."access_for_all_resource"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_drd_access_for_all_resource_in_n42kxem2qa"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_drd_access_for_all_resource_in_diheltexpm"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_drd_access_for_all_resource_in_n42kxem2qa"();

-- The full violation query of law __node_kind_drd_access_for_all_resource_in_access_mwp3luyx53.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'drd:accessForAllResource'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."metadata" FROM "qti"."access_for_all_resource" AS "r5") AS "r6"("c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c9")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __node_kind_drd_access_for_all_resource_in_access_mwp3luyx53 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__node_kind_drd_access_for_all_resource_in_access_mwp3luyx53'::text;
  END IF;
END
$$;
