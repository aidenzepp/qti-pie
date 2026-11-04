-- Validate law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declared_value", "qti"."typed_value_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_mf2mak7xu6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = NEW."value_set" AND "r1"."base_type" = NEW."base_type";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = NEW."value_set" AND "r1"."base_type" = NEW."base_type" AND "r1"."shape" = 'typed'::"qti"."declaration_shape" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DeclaredValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DeclaredValue"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_mf2mak7xu6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_2kog4jhrkz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."base_type" = OLD."base_type";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."declared_value" AS "r1" WHERE "r1"."value_set" = OLD."id" AND "r1"."base_type" = OLD."base_type" AND "r1"."shape" = 'typed'::"qti"."declaration_shape" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DeclaredValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DeclaredValue"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_2kog4jhrkz"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_typed_in_typed_value_set_i6mdrgcxac"
  AFTER INSERT ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."shape" = 'typed'::"qti"."declaration_shape")
  EXECUTE FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_mf2mak7xu6"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_typed_in_typed_value_set_q3irfmqniq"
  AFTER DELETE ON "qti"."typed_value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_shape_typed_in_typed_value_set_2kog4jhrkz"();

-- The full violation query of law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c18" AS "valueSet", "r9"."c19" AS "baseType" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c5", "r2"."c1" FROM (SELECT DISTINCT "r1"."base_type", "r1"."id", "r1"."position", "r1"."shape", "r1"."value_set" FROM "qti"."declared_value" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'typed'::"qti"."declaration_shape") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c13", "r6"."c10" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."declaration", "r5"."id" FROM "qti"."typed_value_set" AS "r5") AS "r6"("c10", "c11", "c12", "c13")) AS "r7"("c14", "c15")) AS "r8"("c16", "c17") WHERE "r8"."c16" = "r4"."c8" AND "r8"."c17" = "r4"."c9")) AS "r9"("c18", "c19")) THEN
    RAISE EXCEPTION 'law __declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__declared_value_shape_typed_in_typed_value_set_v5vx5ppsgl'::"pg_catalog"."text";
  END IF;
END
$$;
