-- Validate law __order_interaction_root_kind_item_in_interaction_y3ulvz7btm: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."interaction_binding", "qti"."order_interaction" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_order_interaction_root_kind_item_in_cylhuxiwjq"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'order_interaction'::text THEN
    IF NEW."root_kind" = 'item'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."order_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __order_interaction_root_kind_item_in_interaction_y3ulvz7btm violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__order_interaction_root_kind_item_in_interaction_y3ulvz7btm'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["OrderInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["OrderInteraction"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."order_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __order_interaction_root_kind_item_in_interaction_y3ulvz7btm violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__order_interaction_root_kind_item_in_interaction_y3ulvz7btm'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["OrderInteraction",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["OrderInteraction"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_order_interaction_root_kind_item_in_cylhuxiwjq"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_order_interaction_root_kind_item_in_u4t2765rsh"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_order_interaction_root_kind_item_in_cylhuxiwjq"();

CREATE CONSTRAINT TRIGGER "__law_order_interaction_root_kind_item_in_hfzckvd77y"
  AFTER INSERT ON "qti"."order_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_order_interaction_root_kind_item_in_cylhuxiwjq"();

-- The full violation query of law __order_interaction_root_kind_item_in_interaction_y3ulvz7btm.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c23" AS "id", "r9"."c24" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c10", "r4"."c11" FROM (SELECT DISTINCT "r3"."c8", "r3"."c9" FROM (SELECT DISTINCT "r2"."c1", "r2"."c5" FROM (SELECT DISTINCT "r1"."id", "r1"."max_bound", "r1"."max_choices_n", "r1"."min_choices_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."order_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'item'::"qti"."root_kind") AS "r3"("c8", "c9")) AS "r4"("c10", "c11") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c19", "r7"."c20" FROM (SELECT DISTINCT "r6"."c16", "r6"."c17" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c12", "c13", "c14", "c15", "c16", "c17", "c18")) AS "r7"("c19", "c20")) AS "r8"("c21", "c22") WHERE "r8"."c21" = "r4"."c10" AND "r8"."c22" = "r4"."c11")) AS "r9"("c23", "c24")) THEN
    RAISE EXCEPTION 'law __order_interaction_root_kind_item_in_interaction_y3ulvz7btm is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__order_interaction_root_kind_item_in_interaction_y3ulvz7btm'::text;
  END IF;
END
$$;
