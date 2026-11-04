-- Validate law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."context_declaration_arm", "qti"."context_declaration_id" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_o7wkgewrbm"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'context_declaration_arm'::text THEN
    IF NEW."version" = '3.0.0'::"qti"."schema_version" THEN
      PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."node" = NEW."id";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."context_declaration_arm" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."version" = '3.0.0'::"qti"."schema_version" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__context_declaration_arm_version_3_0_0_in_context_gjeuesrexk'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ContextDeclarationArm",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["ContextDeclarationArm"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."context_declaration_id" AS "r1" WHERE "r1"."node" = OLD."node";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."context_declaration_arm" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."version" = '3.0.0'::"qti"."schema_version" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__context_declaration_arm_version_3_0_0_in_context_gjeuesrexk'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ContextDeclarationArm",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["ContextDeclarationArm"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_o7wkgewrbm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_context_declaration_arm_version_3_0_0_in_f47fxhjpgr"
  AFTER INSERT ON "qti"."context_declaration_arm"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_o7wkgewrbm"();

CREATE CONSTRAINT TRIGGER "__law_context_declaration_arm_version_3_0_0_in_mwlyq4jlrp"
  AFTER DELETE ON "qti"."context_declaration_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_context_declaration_arm_version_3_0_0_in_o7wkgewrbm"();

-- The full violation query of law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c10" AS "id" FROM (SELECT DISTINCT "r4"."c4" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."version" FROM "qti"."context_declaration_arm" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c2" = '3.0.0'::"qti"."schema_version") AS "r3"("c3")) AS "r4"("c4") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c8" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."node" FROM "qti"."context_declaration_id" AS "r5") AS "r6"("c5", "c6", "c7")) AS "r7"("c8")) AS "r8"("c9") WHERE "r8"."c9" = "r4"."c4")) AS "r9"("c10")) THEN
    RAISE EXCEPTION 'law __context_declaration_arm_version_3_0_0_in_context_gjeuesrexk is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__context_declaration_arm_version_3_0_0_in_context_gjeuesrexk'::text;
  END IF;
END
$$;
