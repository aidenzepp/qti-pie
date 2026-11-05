-- Validate law __item_tool_root_item_in_assessment_item_z3yykgwz5d: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."assessment_item", "qti"."item_tool" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_nq2atjerr6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."assessment_item" AS "r1" WHERE "r1"."tree" = OLD."tree";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."tree" AS "c1" FROM "qti"."item_tool" AS "r1" WHERE "r1"."tree" = OLD."tree" AND "r1"."root" = 'item'::"qti"."root_kind" ORDER BY "r1"."tree" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_tool_root_item_in_assessment_item_z3yykgwz5d violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_tool_root_item_in_assessment_item_z3yykgwz5d'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemTool",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemTool"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_nq2atjerr6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_syzwweq3av"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."assessment_item" AS "r1" WHERE "r1"."tree" = NEW."tree";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."tree" AS "c1" FROM "qti"."item_tool" AS "r1" WHERE "r1"."tree" = NEW."tree" AND "r1"."root" = 'item'::"qti"."root_kind" ORDER BY "r1"."tree" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __item_tool_root_item_in_assessment_item_z3yykgwz5d violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__item_tool_root_item_in_assessment_item_z3yykgwz5d'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ItemTool",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ItemTool"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_syzwweq3av"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_item_tool_root_item_in_assessment_item_7fsoz3n36f"
  AFTER DELETE ON "qti"."assessment_item"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_nq2atjerr6"();

CREATE CONSTRAINT TRIGGER "__law_item_tool_root_item_in_assessment_item_stpxseeguy"
  AFTER INSERT ON "qti"."item_tool"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'item'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_item_tool_root_item_in_assessment_item_syzwweq3av"();

-- The full violation query of law __item_tool_root_item_in_assessment_item_z3yykgwz5d.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "tree" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."root", "r1"."shape", "r1"."tree" FROM "qti"."item_tool" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c1" = 'item'::"qti"."root_kind") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."adaptive", "r5"."id", "r5"."time_dependent", "r5"."tree" FROM "qti"."assessment_item" AS "r5") AS "r6"("c6", "c7", "c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c5")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __item_tool_root_item_in_assessment_item_z3yykgwz5d is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__item_tool_root_item_in_assessment_item_z3yykgwz5d'::"pg_catalog"."text";
  END IF;
END
$$;
