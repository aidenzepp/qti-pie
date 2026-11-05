-- Validate law __slider_interaction_root_kind_item_in_interaction_snurkkvmnz: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."interaction_binding", "qti"."slider_interaction" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_slider_interaction_root_kind_item_in_wdobjvwr4m"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."slider_interaction" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."response_identifier" = OLD."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __slider_interaction_root_kind_item_in_interaction_snurkkvmnz violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__slider_interaction_root_kind_item_in_interaction_snurkkvmnz'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SliderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SliderInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_slider_interaction_root_kind_item_in_wdobjvwr4m"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_slider_interaction_root_kind_item_in_r4ogmjslk3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."interaction_binding" AS "r1" WHERE "r1"."node" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."slider_interaction" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."response_identifier" = NEW."response_identifier" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __slider_interaction_root_kind_item_in_interaction_snurkkvmnz violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__slider_interaction_root_kind_item_in_interaction_snurkkvmnz'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SliderInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SliderInteraction"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_slider_interaction_root_kind_item_in_r4ogmjslk3"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_slider_interaction_root_kind_item_in_h6prlx4iph"
  AFTER DELETE ON "qti"."interaction_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_slider_interaction_root_kind_item_in_wdobjvwr4m"();

CREATE CONSTRAINT TRIGGER "__law_slider_interaction_root_kind_item_in_csb7pfakdo"
  AFTER INSERT ON "qti"."slider_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root_kind" = 'item'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_slider_interaction_root_kind_item_in_r4ogmjslk3"();

-- The full violation query of law __slider_interaction_root_kind_item_in_interaction_snurkkvmnz.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c22" AS "id", "r9"."c23" AS "responseIdentifier" FROM (SELECT DISTINCT "r4"."c9", "r4"."c10" FROM (SELECT DISTINCT "r3"."c7", "r3"."c8" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."id", "r1"."lower_bound", "r1"."response_identifier", "r1"."root_kind", "r1"."step_label", "r1"."upper_bound" FROM "qti"."slider_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c4" = 'item'::"qti"."root_kind") AS "r3"("c7", "c8")) AS "r4"("c9", "c10") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c18", "r7"."c19" FROM (SELECT DISTINCT "r6"."c15", "r6"."c16" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."ancestry", "r5"."document", "r5"."interaction_kind", "r5"."node", "r5"."response_identifier", "r5"."shape" FROM "qti"."interaction_binding" AS "r5") AS "r6"("c11", "c12", "c13", "c14", "c15", "c16", "c17")) AS "r7"("c18", "c19")) AS "r8"("c20", "c21") WHERE "r8"."c20" = "r4"."c9" AND "r8"."c21" = "r4"."c10")) AS "r9"("c22", "c23")) THEN
    RAISE EXCEPTION 'law __slider_interaction_root_kind_item_in_interaction_snurkkvmnz is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__slider_interaction_root_kind_item_in_interaction_snurkkvmnz'::"pg_catalog"."text";
  END IF;
END
$$;
