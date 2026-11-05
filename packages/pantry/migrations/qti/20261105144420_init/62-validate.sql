-- Validate law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."context_declaration_arm", "qti"."context_declaration_id" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_typplscjdc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."node" = NEW."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."context_declaration_arm" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."version" = '3.0.0'::"qti"."schema_version" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__context_declaration_arm_version_3_0_0_in_context_gjeuesrexk'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ContextDeclarationArm",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ContextDeclarationArm"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_typplscjdc"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_2yidepysq5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."node" = OLD."node";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."context_declaration_arm" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."version" = '3.0.0'::"qti"."schema_version" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__context_declaration_arm_version_3_0_0_in_context_gjeuesrexk'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ContextDeclarationArm",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ContextDeclarationArm"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_2yidepysq5"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_context_declaration_arm_version_3_0_0_in_b4tmlifnww"
  AFTER INSERT ON "qti"."context_declaration_arm"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."version" = '3.0.0'::"qti"."schema_version")
  EXECUTE FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_typplscjdc"();

CREATE CONSTRAINT TRIGGER "__law_context_declaration_arm_version_3_0_0_in_gnmfb5aghz"
  AFTER DELETE ON "qti"."context_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_2yidepysq5"();

-- The full violation query of law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c10" AS "id" FROM (SELECT DISTINCT "r4"."c4" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."version" FROM "qti"."context_declaration_arm" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c2" = '3.0.0'::"qti"."schema_version") AS "r3"("c3")) AS "r4"("c4") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c8" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."node" FROM "qti"."context_declaration_id" AS "r5") AS "r6"("c5", "c6", "c7")) AS "r7"("c8")) AS "r8"("c9") WHERE "r8"."c9" = "r4"."c4")) AS "r9"("c10")) THEN
    RAISE EXCEPTION 'law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__context_declaration_arm_version_3_0_0_in_context_gjeuesrexk'::"pg_catalog"."text";
  END IF;
END
$$;
