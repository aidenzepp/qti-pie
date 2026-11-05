-- Validate law __node_label_root_kind_item_in_item_tool_both_djgj4tp536: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."item_tool_both", "qti"."node_label" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_label_root_kind_item_in_item_tool_both_6eqo3cio67"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = OLD."tree";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."node_label" AS "r1" WHERE "r1"."tree" = OLD."tree" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __node_label_root_kind_item_in_item_tool_both_djgj4tp536 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__node_label_root_kind_item_in_item_tool_both_djgj4tp536'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["NodeLabel",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["NodeLabel"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_label_root_kind_item_in_item_tool_both_6eqo3cio67"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_label_root_kind_item_in_item_tool_both_4tnnnqjfyj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."item_tool_both" AS "r1" WHERE "r1"."tree" = NEW."tree";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."node_label" AS "r1" WHERE "r1"."tree" = NEW."tree" AND "r1"."root_kind" = 'item'::"qti"."root_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __node_label_root_kind_item_in_item_tool_both_djgj4tp536 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__node_label_root_kind_item_in_item_tool_both_djgj4tp536'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["NodeLabel",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["NodeLabel"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_label_root_kind_item_in_item_tool_both_4tnnnqjfyj"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_label_root_kind_item_in_item_tool_both_sc3tw6xbiq"
  AFTER DELETE ON "qti"."item_tool_both"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_label_root_kind_item_in_item_tool_both_6eqo3cio67"();

CREATE CONSTRAINT TRIGGER "__law_node_label_root_kind_item_in_item_tool_both_dn65yn54bq"
  AFTER INSERT ON "qti"."node_label"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root_kind" = 'item'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_node_label_root_kind_item_in_item_tool_both_4tnnnqjfyj"();

-- The full violation query of law __node_label_root_kind_item_in_item_tool_both_djgj4tp536.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "tree" FROM (SELECT DISTINCT "r4"."c8" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c5" FROM (SELECT DISTINCT "r1"."attribute", "r1"."kind", "r1"."node", "r1"."root_kind", "r1"."tree", "r1"."value" FROM "qti"."node_label" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c4" = 'item'::"qti"."root_kind") AS "r3"("c7")) AS "r4"("c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c11" FROM (SELECT DISTINCT "r5"."tool_name", "r5"."tool_version", "r5"."tree" FROM "qti"."item_tool_both" AS "r5") AS "r6"("c9", "c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c8")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __node_label_root_kind_item_in_item_tool_both_djgj4tp536 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_label_root_kind_item_in_item_tool_both_djgj4tp536'::"pg_catalog"."text";
  END IF;
END
$$;
