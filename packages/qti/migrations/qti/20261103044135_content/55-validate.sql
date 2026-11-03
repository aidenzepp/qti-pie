-- Validate law __gap_match_interaction_root_kind_item_in_eg5qbiyfhi: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."gap_match_interaction", "qti"."interaction_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_gap_match_interaction_root_kind_item_in_6ha6fkrva7"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'gap_match_interaction'::text THEN
    IF NEW."root_kind" = 'item'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."gap_match_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __gap_match_interaction_root_kind_item_in_eg5qbiyfhi violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__gap_match_interaction_root_kind_item_in_eg5qbiyfhi'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GapMatchInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["GapMatchInteraction"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."gap_match_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __gap_match_interaction_root_kind_item_in_eg5qbiyfhi violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__gap_match_interaction_root_kind_item_in_eg5qbiyfhi'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GapMatchInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["GapMatchInteraction"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_gap_match_interaction_root_kind_item_in_6ha6fkrva7"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_gap_match_interaction_root_kind_item_in_xxid25dsgm"
  AFTER INSERT ON "qti"."gap_match_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_gap_match_interaction_root_kind_item_in_6ha6fkrva7"();

CREATE CONSTRAINT TRIGGER "__law_gap_match_interaction_root_kind_item_in_n2n626czea"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_gap_match_interaction_root_kind_item_in_6ha6fkrva7"();

-- The full violation query of law __gap_match_interaction_root_kind_item_in_eg5qbiyfhi.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c22" AS "id", "r9"."c23" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10" FROM (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c1", "r2"."c4" FROM (SELECT DISTINCT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."gap_match_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c5" = 'item'::"qti"."root_kind") AS "r3"("c7", "c8")) AS "r4"("c9", "c10") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c18", "r7"."c19" FROM (SELECT DISTINCT "r6"."c15", "r6"."c16" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c11", "c12", "c13", "c14", "c15", "c16", "c17")) AS "r7"("c18", "c19")) AS "r8"("c20", "c21") WHERE "r8"."c20" = "r4"."c9" AND "r8"."c21" = "r4"."c10")) AS "r9"("c22", "c23")) THEN
    RAISE EXCEPTION 'law __gap_match_interaction_root_kind_item_in_eg5qbiyfhi is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__gap_match_interaction_root_kind_item_in_eg5qbiyfhi'::text;
  END IF;
END
$$;
