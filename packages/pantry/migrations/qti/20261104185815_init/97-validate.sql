-- Validate law __declared_value_shape_alternatives_fu4fbdicnx: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."declared_value", "qti"."record_field" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_declared_value_shape_alternatives_l7ls7ahl44"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'typed'::"qti"."declaration_shape" THEN
      WHEN 'record'::"qti"."declaration_shape" THEN
        PERFORM 1 FROM "qti"."record_field" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __declared_value_shape_alternatives_fu4fbdicnx violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__declared_value_shape_alternatives_fu4fbdicnx'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DeclaredValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DeclaredValue"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declared_value_shape_alternatives_l7ls7ahl44"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_declared_value_shape_alternatives_i4obb3i2on"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."declared_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'record'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."record_field" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __declared_value_shape_alternatives_fu4fbdicnx violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__declared_value_shape_alternatives_fu4fbdicnx'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["DeclaredValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["DeclaredValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_declared_value_shape_alternatives_i4obb3i2on"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_alternatives_zmjhcpaex2"
  AFTER INSERT ON "qti"."declared_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_shape_alternatives_l7ls7ahl44"();

CREATE CONSTRAINT TRIGGER "__law_declared_value_shape_alternatives_alpycblw3r"
  AFTER DELETE ON "qti"."record_field"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_declared_value_shape_alternatives_i4obb3i2on"();

-- The full violation query of law __declared_value_shape_alternatives_fu4fbdicnx.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "id" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."base_type", "r1"."id", "r1"."position", "r1"."shape", "r1"."value_set" FROM "qti"."declared_value" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'record'::"qti"."declaration_shape") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."field_identifier", "r5"."id" FROM "qti"."record_field" AS "r5") AS "r6"("c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c7")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __declared_value_shape_alternatives_fu4fbdicnx is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__declared_value_shape_alternatives_fu4fbdicnx'::"pg_catalog"."text";
  END IF;
END
$$;
