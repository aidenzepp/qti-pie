-- Validate law __lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_general_title", "qti"."resource_lom_titled" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_general_title_owner_resource_in_resource_5dkovfyky5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = NEW."lom";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."lom" AS "c1" FROM "qti"."lom_general_title" AS "r1" WHERE "r1"."lom" = NEW."lom" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."lom" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["LomGeneralTitle",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["LomGeneralTitle"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_general_title_owner_resource_in_resource_5dkovfyky5"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_general_title_owner_resource_in_resource_mqm7qhb6vg"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."resource_lom_titled" AS "r1" WHERE "r1"."lom" = OLD."lom";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."lom" AS "c1" FROM "qti"."lom_general_title" AS "r1" WHERE "r1"."lom" = OLD."lom" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."lom" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["LomGeneralTitle",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["LomGeneralTitle"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_general_title_owner_resource_in_resource_mqm7qhb6vg"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_lom_general_title_owner_resource_in_resource_jyluljv6xx"
  AFTER INSERT ON "qti"."lom_general_title"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."owner" = 'resource'::"qti"."lom_owner")
  EXECUTE FUNCTION "qti"."__law_lom_general_title_owner_resource_in_resource_5dkovfyky5"();

CREATE CONSTRAINT TRIGGER "__law_lom_general_title_owner_resource_in_resource_r4g3erwuwi"
  AFTER DELETE ON "qti"."resource_lom_titled"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_general_title_owner_resource_in_resource_mqm7qhb6vg"();

-- The full violation query of law __lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "lom" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."id", "r1"."lom", "r1"."owner" FROM "qti"."lom_general_title" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c3" = 'resource'::"qti"."lom_owner") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c6" FROM (SELECT DISTINCT "r5"."lom", "r5"."package", "r5"."resource", "r5"."type" FROM "qti"."resource_lom_titled" AS "r5") AS "r6"("c6", "c7", "c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c5")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__lom_general_title_owner_resource_in_resource_lom_ypmfjpdyby'::"pg_catalog"."text";
  END IF;
END
$$;
