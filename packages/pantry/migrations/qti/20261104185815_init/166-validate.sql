-- Validate law __end_attempt_interaction_root_kind_item_in_grf6io3tez: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."end_attempt_interaction", "qti"."interaction_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_ustlshknjy"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."end_attempt_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __end_attempt_interaction_root_kind_item_in_grf6io3tez violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__end_attempt_interaction_root_kind_item_in_grf6io3tez'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["EndAttemptInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["EndAttemptInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_ustlshknjy"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_fjew65sz35"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."end_attempt_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __end_attempt_interaction_root_kind_item_in_grf6io3tez violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__end_attempt_interaction_root_kind_item_in_grf6io3tez'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["EndAttemptInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["EndAttemptInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_fjew65sz35"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_end_attempt_interaction_root_kind_item_in_5pomdbuh4l"
  AFTER INSERT ON "qti"."end_attempt_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root_kind" = 'item'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_ustlshknjy"();

CREATE CONSTRAINT TRIGGER "__law_end_attempt_interaction_root_kind_item_in_wiyqn2r7wr"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_end_attempt_interaction_root_kind_item_in_fjew65sz35"();

-- The full violation query of law __end_attempt_interaction_root_kind_item_in_grf6io3tez.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c20" AS "id", "r9"."c21" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c7", "r4"."c8" FROM (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c1", "r2"."c2" FROM (SELECT DISTINCT "r1"."id", "r1"."response_identifier", "r1"."root_kind", "r1"."title" FROM "qti"."end_attempt_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c3" = 'item'::"qti"."root_kind") AS "r3"("c5", "c6")) AS "r4"("c7", "c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13", "c14", "c15")) AS "r7"("c16", "c17")) AS "r8"("c18", "c19") WHERE "r8"."c18" = "r4"."c7" AND "r8"."c19" = "r4"."c8")) AS "r9"("c20", "c21")) THEN
    RAISE EXCEPTION 'law __end_attempt_interaction_root_kind_item_in_grf6io3tez is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__end_attempt_interaction_root_kind_item_in_grf6io3tez'::"pg_catalog"."text";
  END IF;
END
$$;
