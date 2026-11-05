-- Validate law __drawing_interaction_root_kind_item_in_interaction_auflx7bqd2: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."drawing_interaction", "qti"."interaction_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_drawing_interaction_root_kind_item_in_5ijfossxxj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."drawing_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __drawing_interaction_root_kind_item_in_interaction_auflx7bqd2 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__drawing_interaction_root_kind_item_in_interaction_auflx7bqd2'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DrawingInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DrawingInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_drawing_interaction_root_kind_item_in_5ijfossxxj"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_drawing_interaction_root_kind_item_in_sbcicfqprt"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."drawing_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __drawing_interaction_root_kind_item_in_interaction_auflx7bqd2 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__drawing_interaction_root_kind_item_in_interaction_auflx7bqd2'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DrawingInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DrawingInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_drawing_interaction_root_kind_item_in_sbcicfqprt"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_drawing_interaction_root_kind_item_in_ujp47s6jpm"
  AFTER INSERT ON "qti"."drawing_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root_kind" = 'item'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_drawing_interaction_root_kind_item_in_5ijfossxxj"();

CREATE CONSTRAINT TRIGGER "__law_drawing_interaction_root_kind_item_in_nvmtkop2mk"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_drawing_interaction_root_kind_item_in_sbcicfqprt"();

-- The full violation query of law __drawing_interaction_root_kind_item_in_interaction_auflx7bqd2.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c19" AS "id", "r9"."c20" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c6", "r4"."c7" FROM (SELECT DISTINCT "r3"."c4", "r3"."c5" FROM (SELECT DISTINCT "r2"."c1", "r2"."c2" FROM (SELECT DISTINCT "r1"."id", "r1"."response_identifier", "r1"."root_kind" FROM "qti"."drawing_interaction" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c3" = 'item'::"qti"."root_kind") AS "r3"("c4", "c5")) AS "r4"("c6", "c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c12", "r6"."c13" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12", "c13", "c14")) AS "r7"("c15", "c16")) AS "r8"("c17", "c18") WHERE "r8"."c17" = "r4"."c6" AND "r8"."c18" = "r4"."c7")) AS "r9"("c19", "c20")) THEN
    RAISE EXCEPTION 'law __drawing_interaction_root_kind_item_in_interaction_auflx7bqd2 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__drawing_interaction_root_kind_item_in_interaction_auflx7bqd2'::"pg_catalog"."text";
  END IF;
END
$$;
