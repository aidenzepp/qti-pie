-- Validate law __node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."end_attempt_interaction", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_qti_end_attempt_interaction_in_end_edqju26fr4"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'node'::text THEN
    IF NEW."kind" = 'qti-end-attempt-interaction'::"qti"."node_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'qti-end-attempt-interaction'::"qti"."node_kind" THEN
          PERFORM 1 FROM "qti"."end_attempt_interaction" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'qti-end-attempt-interaction'::"qti"."node_kind" THEN
        PERFORM 1 FROM "qti"."end_attempt_interaction" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl'::text,
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_qti_end_attempt_interaction_in_end_edqju26fr4"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_end_attempt_interaction_in_end_oks5gmnpfv"
  AFTER DELETE ON "qti"."end_attempt_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_qti_end_attempt_interaction_in_end_edqju26fr4"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_end_attempt_interaction_in_end_3racpqkbgi"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_qti_end_attempt_interaction_in_end_edqju26fr4"();

-- The full violation query of law __node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c16" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'qti-end-attempt-interaction'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."response_identifier", "r5"."root_kind", "r5"."title" FROM "qti"."end_attempt_interaction" AS "r5") AS "r6"("c10", "c11", "c12", "c13")) AS "r7"("c14")) AS "r8"("c15") WHERE "r8"."c15" = "r4"."c9")) AS "r9"("c16")) THEN
    RAISE EXCEPTION 'law __node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__node_kind_qti_end_attempt_interaction_in_end_k5peni6xdl'::text;
  END IF;
END
$$;
