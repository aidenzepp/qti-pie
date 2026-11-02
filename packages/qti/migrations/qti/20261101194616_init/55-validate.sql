-- Validate law __value_set_role_default_in_default_value_arm_2e42h2gv4m: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."default_value_arm", "qti"."value_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_value_set_role_default_in_default_value_arm_6bn64r3hk6"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'value_set'::text THEN
    IF NEW."role" = 'default'::"qti"."value_role" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."role" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'default'::"qti"."value_role" THEN
          PERFORM 1 FROM "qti"."default_value_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __value_set_role_default_in_default_value_arm_2e42h2gv4m violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__value_set_role_default_in_default_value_arm_2e42h2gv4m'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ValueSet",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ValueSet"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."role" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'default'::"qti"."value_role" THEN
        PERFORM 1 FROM "qti"."default_value_arm" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __value_set_role_default_in_default_value_arm_2e42h2gv4m violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__value_set_role_default_in_default_value_arm_2e42h2gv4m'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ValueSet",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["ValueSet"]'::text END;
        END IF;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_value_set_role_default_in_default_value_arm_6bn64r3hk6"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_value_set_role_default_in_default_value_arm_u7xtwkds2s"
  AFTER DELETE ON "qti"."default_value_arm"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_role_default_in_default_value_arm_6bn64r3hk6"();

CREATE CONSTRAINT TRIGGER "__law_value_set_role_default_in_default_value_arm_jijeodzme6"
  AFTER INSERT ON "qti"."value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_role_default_in_default_value_arm_6bn64r3hk6"();

-- The full violation query of law __value_set_role_default_in_default_value_arm_2e42h2gv4m.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c10" AS "id" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."declaration", "r1"."id", "r1"."role", "r1"."shape" FROM "qti"."value_set" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c3" = 'default'::"qti"."value_role") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c8" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."id" FROM "qti"."default_value_arm" AS "r5") AS "r6"("c7")) AS "r7"("c8")) AS "r8"("c9") WHERE "r8"."c9" = "r4"."c6")) AS "r9"("c10")) THEN
    RAISE EXCEPTION 'law __value_set_role_default_in_default_value_arm_2e42h2gv4m is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__value_set_role_default_in_default_value_arm_2e42h2gv4m'::text;
  END IF;
END
$$;
