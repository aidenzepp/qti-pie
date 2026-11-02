-- Validate law __graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."graphic_gap_match_interaction", "qti"."interaction_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_graphic_gap_match_interaction_root_kind_item_ln34gamwd2"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'graphic_gap_match_interaction'::text THEN
    IF NEW."root_kind" = 'item'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."graphic_gap_match_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5 violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GraphicGapMatchInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["GraphicGapMatchInteraction"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."graphic_gap_match_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GraphicGapMatchInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["GraphicGapMatchInteraction"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_graphic_gap_match_interaction_root_kind_item_ln34gamwd2"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_graphic_gap_match_interaction_root_kind_item_ok56phisru"
  AFTER INSERT ON "qti"."graphic_gap_match_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_graphic_gap_match_interaction_root_kind_item_ln34gamwd2"();

CREATE CONSTRAINT TRIGGER "__law_graphic_gap_match_interaction_root_kind_item_y7nbmcohma"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_graphic_gap_match_interaction_root_kind_item_ln34gamwd2"();

-- The full violation query of law __graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c21" AS "id", "r9"."c22" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c1", "r2"."c4" FROM (SELECT DISTINCT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind" FROM "qti"."graphic_gap_match_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = 'item'::"qti"."root_kind") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c14", "r6"."c15" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14", "c15", "c16")) AS "r7"("c17", "c18")) AS "r8"("c19", "c20") WHERE "r8"."c19" = "r4"."c8" AND "r8"."c20" = "r4"."c9")) AS "r9"("c21", "c22")) THEN
    RAISE EXCEPTION 'law __graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__graphic_gap_match_interaction_root_kind_item_in_wph5gqcpm5'::text;
  END IF;
END
$$;
