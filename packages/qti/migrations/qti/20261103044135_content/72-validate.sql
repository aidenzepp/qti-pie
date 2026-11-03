-- Validate law __text_entry_interaction_root_kind_item_in_qbqep7nfyz: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."interaction_binding", "qti"."text_entry_interaction" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_text_entry_interaction_root_kind_item_in_4ly5urbpqy"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'text_entry_interaction'::text THEN
    IF NEW."root_kind" = 'item'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."text_entry_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __text_entry_interaction_root_kind_item_in_qbqep7nfyz violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__text_entry_interaction_root_kind_item_in_qbqep7nfyz'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["TextEntryInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["TextEntryInteraction"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."text_entry_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __text_entry_interaction_root_kind_item_in_qbqep7nfyz violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__text_entry_interaction_root_kind_item_in_qbqep7nfyz'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["TextEntryInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["TextEntryInteraction"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_text_entry_interaction_root_kind_item_in_4ly5urbpqy"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_text_entry_interaction_root_kind_item_in_v5dd7i42yq"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_text_entry_interaction_root_kind_item_in_4ly5urbpqy"();

CREATE CONSTRAINT TRIGGER "__law_text_entry_interaction_root_kind_item_in_ord73l3o4j"
  AFTER INSERT ON "qti"."text_entry_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_text_entry_interaction_root_kind_item_in_4ly5urbpqy"();

-- The full violation query of law __text_entry_interaction_root_kind_item_in_qbqep7nfyz.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c20" AS "id", "r9"."c21" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c7", "r4"."c8" FROM (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c2", "r2"."c3" FROM (SELECT DISTINCT "r1"."base", "r1"."id", "r1"."response_identifier", "r1"."root_kind" FROM "qti"."text_entry_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'item'::"qti"."root_kind") AS "r3"("c5", "c6")) AS "r4"("c7", "c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13", "c14", "c15")) AS "r7"("c16", "c17")) AS "r8"("c18", "c19") WHERE "r8"."c18" = "r4"."c7" AND "r8"."c19" = "r4"."c8")) AS "r9"("c20", "c21")) THEN
    RAISE EXCEPTION 'law __text_entry_interaction_root_kind_item_in_qbqep7nfyz is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__text_entry_interaction_root_kind_item_in_qbqep7nfyz'::text;
  END IF;
END
$$;
