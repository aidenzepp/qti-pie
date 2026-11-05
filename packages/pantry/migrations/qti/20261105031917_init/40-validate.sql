-- Validate law __variable_ref_kind_alternatives_5tghedigzl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."built_in_ref", "qti"."declared_ref", "qti"."template_parameter_ref", "qti"."variable_ref" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_mrplutcx7h"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'builtIn'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."built_in_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_mrplutcx7h"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_qb35yzgjml"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'declared'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."declared_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_qb35yzgjml"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_ivpo2os5d6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'templateParameter'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."template_parameter_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_ivpo2os5d6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_slztlbyb4t"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'declared'::"qti"."ref_kind" THEN
        PERFORM 1 FROM "qti"."declared_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'builtIn'::"qti"."ref_kind" THEN
        PERFORM 1 FROM "qti"."built_in_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'itemVariable'::"qti"."ref_kind" THEN
      WHEN 'itemInstanceVariable'::"qti"."ref_kind" THEN
      WHEN 'sectionDuration'::"qti"."ref_kind" THEN
      WHEN 'templateParameter'::"qti"."ref_kind" THEN
        PERFORM 1 FROM "qti"."template_parameter_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_slztlbyb4t"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_meoeap5rbu"
  AFTER DELETE ON "qti"."built_in_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_mrplutcx7h"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_53tslbo6zi"
  AFTER DELETE ON "qti"."declared_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_qb35yzgjml"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_okxnwzk6zu"
  AFTER DELETE ON "qti"."template_parameter_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_ivpo2os5d6"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_u6jd2qfcar"
  AFTER INSERT ON "qti"."variable_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_slztlbyb4t"();

-- The full violation query of law __variable_ref_kind_alternatives_5tghedigzl.
DO $$
BEGIN
  IF EXISTS (SELECT "r28"."c38" AS "id" FROM (SELECT "r9"."c13" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."kind" FROM "qti"."variable_ref" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c3" = 'declared'::"qti"."ref_kind") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."declaration_kind", "r5"."document", "r5"."id", "r5"."identifier", "r5"."referrer_kind" FROM "qti"."declared_ref" AS "r5") AS "r6"("c6", "c7", "c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c5")) AS "r9"("c13") UNION SELECT "r18"."c24" FROM (SELECT DISTINCT "r13"."c18" FROM (SELECT DISTINCT "r12"."c17" FROM (SELECT DISTINCT "r11"."c15" FROM (SELECT DISTINCT "r10"."document", "r10"."id", "r10"."kind" FROM "qti"."variable_ref" AS "r10") AS "r11"("c14", "c15", "c16") WHERE "r11"."c16" = 'builtIn'::"qti"."ref_kind") AS "r12"("c17")) AS "r13"("c18") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c19" FROM (SELECT DISTINCT "r14"."id", "r14"."name", "r14"."referrer_kind" FROM "qti"."built_in_ref" AS "r14") AS "r15"("c19", "c20", "c21")) AS "r16"("c22")) AS "r17"("c23") WHERE "r17"."c23" = "r13"."c18")) AS "r18"("c24") UNION SELECT "r27"."c37" FROM (SELECT DISTINCT "r22"."c29" FROM (SELECT DISTINCT "r21"."c28" FROM (SELECT DISTINCT "r20"."c26" FROM (SELECT DISTINCT "r19"."document", "r19"."id", "r19"."kind" FROM "qti"."variable_ref" AS "r19") AS "r20"("c25", "c26", "c27") WHERE "r20"."c27" = 'templateParameter'::"qti"."ref_kind") AS "r21"("c28")) AS "r22"("c29") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c35" FROM (SELECT DISTINCT "r24"."c31" FROM (SELECT DISTINCT "r23"."document", "r23"."id", "r23"."identifier", "r23"."referrer_kind", "r23"."root_kind" FROM "qti"."template_parameter_ref" AS "r23") AS "r24"("c30", "c31", "c32", "c33", "c34")) AS "r25"("c35")) AS "r26"("c36") WHERE "r26"."c36" = "r22"."c29")) AS "r27"("c37")) AS "r28"("c38")) THEN
    RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text";
  END IF;
END
$$;
