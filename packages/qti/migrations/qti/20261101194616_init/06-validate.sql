-- Validate law __declared_value_shape_alternatives_fu4fbdicnx: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declared_value", "qti"."record_field" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declared_value_shape_alternatives_3ylemaegbl"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'declared_value'::text THEN
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      CASE "p"."c2"
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_field" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __declared_value_shape_alternatives_fu4fbdicnx violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__declared_value_shape_alternatives_fu4fbdicnx'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
          END IF;
        ELSE
      END CASE;
    END LOOP;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      CASE "p"."c2"
        WHEN 'record'::"qti"."declaration_shape" THEN
          PERFORM 1 FROM "qti"."record_field" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __declared_value_shape_alternatives_fu4fbdicnx violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__declared_value_shape_alternatives_fu4fbdicnx'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
          END IF;
        ELSE
      END CASE;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declared_value_shape_alternatives_3ylemaegbl"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_alternatives_t2luymqvvk"
  AFTER INSERT ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_shape_alternatives_3ylemaegbl"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_alternatives_orevxj6eud"
  AFTER DELETE ON "qti"."record_field"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_shape_alternatives_3ylemaegbl"();

-- The full violation query of law __declared_value_shape_alternatives_fu4fbdicnx.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "id" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."base_type", "r1"."id", "r1"."position", "r1"."shape", "r1"."value_set" FROM "qti"."declared_value" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'record'::"qti"."declaration_shape") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."field_identifier", "r5"."id" FROM "qti"."record_field" AS "r5") AS "r6"("c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c7")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __declared_value_shape_alternatives_fu4fbdicnx is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__declared_value_shape_alternatives_fu4fbdicnx'::text;
  END IF;
END
$$;
