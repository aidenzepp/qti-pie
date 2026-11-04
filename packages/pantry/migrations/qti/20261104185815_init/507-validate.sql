-- Validate law __value_set_shape_alternatives_drug5mnsg7: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."record_value_set", "qti"."typed_value_set", "qti"."value_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_value_set_shape_alternatives_gxcabhumhi"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'record'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."record_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ValueSet",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ValueSet"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_value_set_shape_alternatives_gxcabhumhi"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_value_set_shape_alternatives_o2j7pasuxo"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'typed'::"qti"."declaration_shape" THEN
      PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ValueSet",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ValueSet"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_value_set_shape_alternatives_o2j7pasuxo"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_value_set_shape_alternatives_qrymwrmonp"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."value_set" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'typed'::"qti"."declaration_shape" THEN
        PERFORM 1 FROM "qti"."typed_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ValueSet",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ValueSet"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'record'::"qti"."declaration_shape" THEN
        PERFORM 1 FROM "qti"."record_value_set" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ValueSet",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ValueSet"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_value_set_shape_alternatives_qrymwrmonp"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_value_set_shape_alternatives_p4tlqzs4kn"
  AFTER DELETE ON "qti"."record_value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_shape_alternatives_gxcabhumhi"();

CREATE CONSTRAINT TRIGGER "__law_value_set_shape_alternatives_zzuxe7wsk4"
  AFTER DELETE ON "qti"."typed_value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_shape_alternatives_o2j7pasuxo"();

CREATE CONSTRAINT TRIGGER "__law_value_set_shape_alternatives_sx475l3riv"
  AFTER INSERT ON "qti"."value_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_value_set_shape_alternatives_qrymwrmonp"();

-- The full violation query of law __value_set_shape_alternatives_drug5mnsg7.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c24" AS "id" FROM (SELECT "r9"."c13" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."declaration", "r1"."id", "r1"."role", "r1"."shape" FROM "qti"."value_set" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'typed'::"qti"."declaration_shape") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."base_type", "r5"."cardinality", "r5"."declaration", "r5"."id" FROM "qti"."typed_value_set" AS "r5") AS "r6"("c7", "c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c6")) AS "r9"("c13") UNION SELECT "r18"."c23" FROM (SELECT DISTINCT "r13"."c19" FROM (SELECT DISTINCT "r12"."c18" FROM (SELECT DISTINCT "r11"."c15" FROM (SELECT DISTINCT "r10"."declaration", "r10"."id", "r10"."role", "r10"."shape" FROM "qti"."value_set" AS "r10") AS "r11"("c14", "c15", "c16", "c17") WHERE "r11"."c17" = 'record'::"qti"."declaration_shape") AS "r12"("c18")) AS "r13"("c19") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c21" FROM (SELECT DISTINCT "r15"."c20" FROM (SELECT DISTINCT "r14"."id" FROM "qti"."record_value_set" AS "r14") AS "r15"("c20")) AS "r16"("c21")) AS "r17"("c22") WHERE "r17"."c22" = "r13"."c19")) AS "r18"("c23")) AS "r19"("c24")) THEN
    RAISE EXCEPTION 'law __value_set_shape_alternatives_drug5mnsg7 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__value_set_shape_alternatives_drug5mnsg7'::"pg_catalog"."text";
  END IF;
END
$$;
