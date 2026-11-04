-- Validate law __end_attempt_interaction_root_kind_item_in_grf6io3tez: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."end_attempt_interaction", "qti"."interaction_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_6t2vtkndtm"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'end_attempt_interaction'::text THEN
    IF NEW."root_kind" = 'item'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."end_attempt_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __end_attempt_interaction_root_kind_item_in_grf6io3tez violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__end_attempt_interaction_root_kind_item_in_grf6io3tez'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["EndAttemptInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["EndAttemptInteraction"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."end_attempt_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __end_attempt_interaction_root_kind_item_in_grf6io3tez violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__end_attempt_interaction_root_kind_item_in_grf6io3tez'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["EndAttemptInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["EndAttemptInteraction"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_6t2vtkndtm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_end_attempt_interaction_root_kind_item_in_zkz2cuhhsy"
  AFTER INSERT ON "qti"."end_attempt_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_6t2vtkndtm"();

CREATE CONSTRAINT TRIGGER "__law_end_attempt_interaction_root_kind_item_in_57oegrbaon"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_6t2vtkndtm"();

-- The full violation query of law __end_attempt_interaction_root_kind_item_in_grf6io3tez.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c20" AS "id", "r9"."c21" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c7", "r4"."c8" FROM (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c1", "r2"."c2" FROM (SELECT DISTINCT "r1"."id", "r1"."response_identifier", "r1"."root_kind", "r1"."title" FROM "qti"."end_attempt_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c3" = 'item'::"qti"."root_kind") AS "r3"("c5", "c6")) AS "r4"("c7", "c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13", "c14", "c15")) AS "r7"("c16", "c17")) AS "r8"("c18", "c19") WHERE "r8"."c18" = "r4"."c7" AND "r8"."c19" = "r4"."c8")) AS "r9"("c20", "c21")) THEN
    RAISE EXCEPTION 'law __end_attempt_interaction_root_kind_item_in_grf6io3tez is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__end_attempt_interaction_root_kind_item_in_grf6io3tez'::text;
  END IF;
END
$$;
