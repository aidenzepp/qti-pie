-- Validate law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declared_value", "qti"."typed_value_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_c5t2mvzfki"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'declared_value'::text THEN
    IF NEW."shape" = 'typed'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = NEW."value_set" AND "r1"."base_type" = NEW."base_type";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = NEW."value_set" AND "r1"."base_type" = NEW."base_type" AND "r1"."shape" = 'typed'::"qti"."declaration_shape" ORDER BY "r1"."id" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."base_type" = OLD."base_type";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = OLD."id" AND "r1"."base_type" = OLD."base_type" AND "r1"."shape" = 'typed'::"qti"."declaration_shape" ORDER BY "r1"."id" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["DeclaredValue",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["DeclaredValue"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_c5t2mvzfki"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_typed_in_typed_value_set_lgwmxbgdqa"
  AFTER INSERT ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_c5t2mvzfki"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_typed_in_typed_value_set_7gbbmjqgdv"
  AFTER DELETE ON "qti"."typed_value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_c5t2mvzfki"();

-- The full violation query of law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c18" AS "valueSet", "r9"."c19" AS "baseType" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c5", "r2"."c1" FROM (SELECT DISTINCT "r1"."base_type", "r1"."id", "r1"."position", "r1"."shape", "r1"."value_set" FROM "qti"."declared_value" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'typed'::"qti"."declaration_shape") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c13", "r6"."c10" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."declaration", "r5"."id" FROM "qti"."typed_value_set" AS "r5") AS "r6"("c10", "c11", "c12", "c13")) AS "r7"("c14", "c15")) AS "r8"("c16", "c17") WHERE "r8"."c16" = "r4"."c8" AND "r8"."c17" = "r4"."c9")) AS "r9"("c18", "c19")) THEN
    RAISE EXCEPTION 'law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl'::text;
  END IF;
END
$$;
