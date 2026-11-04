-- Validate law __media_interaction_root_kind_item_in_interaction_dkvmmv4q7e: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."interaction_binding", "qti"."media_interaction" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_media_interaction_root_kind_item_in_fxjqjuceaz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."media_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __media_interaction_root_kind_item_in_interaction_dkvmmv4q7e violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__media_interaction_root_kind_item_in_interaction_dkvmmv4q7e'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MediaInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MediaInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_media_interaction_root_kind_item_in_fxjqjuceaz"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_media_interaction_root_kind_item_in_fodtvochoz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."media_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __media_interaction_root_kind_item_in_interaction_dkvmmv4q7e violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__media_interaction_root_kind_item_in_interaction_dkvmmv4q7e'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MediaInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MediaInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_media_interaction_root_kind_item_in_fodtvochoz"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_media_interaction_root_kind_item_in_e3la3w7xto"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_media_interaction_root_kind_item_in_fxjqjuceaz"();

CREATE CONSTRAINT TRIGGER "__law_media_interaction_root_kind_item_in_haf6yzog7c"
  AFTER INSERT ON "qti"."media_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root_kind" = 'item'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_media_interaction_root_kind_item_in_fodtvochoz"();

-- The full violation query of law __media_interaction_root_kind_item_in_interaction_dkvmmv4q7e.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c23" AS "id", "r9"."c24" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c10", "r4"."c11" FROM (SELECT DISTINCT "r3"."c8", "r3"."c9" FROM (SELECT DISTINCT "r2"."c2", "r2"."c6" FROM (SELECT DISTINCT "r1"."autostart", "r1"."id", "r1"."loop", "r1"."max_plays_n", "r1"."min_plays_n", "r1"."response_identifier", "r1"."root_kind" FROM "qti"."media_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c7" = 'item'::"qti"."root_kind") AS "r3"("c8", "c9")) AS "r4"("c10", "c11") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c19", "r7"."c20" FROM (SELECT DISTINCT "r6"."c16", "r6"."c17" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c12", "c13", "c14", "c15", "c16", "c17", "c18")) AS "r7"("c19", "c20")) AS "r8"("c21", "c22") WHERE "r8"."c21" = "r4"."c10" AND "r8"."c22" = "r4"."c11")) AS "r9"("c23", "c24")) THEN
    RAISE EXCEPTION 'law __media_interaction_root_kind_item_in_interaction_dkvmmv4q7e is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__media_interaction_root_kind_item_in_interaction_dkvmmv4q7e'::"pg_catalog"."text";
  END IF;
END
$$;
