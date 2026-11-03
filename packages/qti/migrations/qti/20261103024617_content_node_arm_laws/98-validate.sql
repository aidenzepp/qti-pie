-- Validate law __node_kind_ol_in_ol_secdjoo275: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."node", "qti"."ol" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_ol_in_ol_lg3qdxyy3e"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'node'::text THEN
    IF NEW."kind" = 'ol'::"qti"."node_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'ol'::"qti"."node_kind" THEN
          PERFORM 1 FROM "qti"."ol" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __node_kind_ol_in_ol_secdjoo275 violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__node_kind_ol_in_ol_secdjoo275'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'ol'::"qti"."node_kind" THEN
        PERFORM 1 FROM "qti"."ol" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __node_kind_ol_in_ol_secdjoo275 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__node_kind_ol_in_ol_secdjoo275'::text,
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_ol_in_ol_lg3qdxyy3e"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_ol_in_ol_cmrt5f2xdx"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_ol_in_ol_lg3qdxyy3e"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_ol_in_ol_5scluss7d5"
  AFTER DELETE ON "qti"."ol"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_ol_in_ol_lg3qdxyy3e"();

-- The full violation query of law __node_kind_ol_in_ol_secdjoo275.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c13" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'ol'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."id" FROM "qti"."ol" AS "r5") AS "r6"("c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c9")) AS "r9"("c13")) THEN
    RAISE EXCEPTION 'law __node_kind_ol_in_ol_secdjoo275 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__node_kind_ol_in_ol_secdjoo275'::text;
  END IF;
END
$$;
