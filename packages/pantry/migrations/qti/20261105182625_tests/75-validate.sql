-- Validate law __variable_ref_kind_alternatives_5tghedigzl: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."built_in_ref", "qti"."declared_ref", "qti"."item_instance_variable_ref", "qti"."item_variable_ref", "qti"."section_duration_ref", "qti"."section_variable_ref", "qti"."template_parameter_ref", "qti"."variable_ref" IN SHARE ROW EXCLUSIVE MODE;

DROP TRIGGER "__law_variable_ref_kind_alternatives_meoeap5rbu" ON "qti"."built_in_ref";

DROP TRIGGER "__law_variable_ref_kind_alternatives_53tslbo6zi" ON "qti"."declared_ref";

DROP TRIGGER "__law_variable_ref_kind_alternatives_okxnwzk6zu" ON "qti"."template_parameter_ref";

DROP TRIGGER "__law_variable_ref_kind_alternatives_u6jd2qfcar" ON "qti"."variable_ref";

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_azxxvv3rvr"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'itemInstanceVariable'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."item_instance_variable_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_azxxvv3rvr"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_vq6atunf3c"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'itemVariable'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."item_variable_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_vq6atunf3c"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_o4kmgjzkcg"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'sectionDuration'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."section_duration_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_o4kmgjzkcg"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variable_ref_kind_alternatives_aqsuim3inz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."variable_ref" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'sectionVariable'::"qti"."ref_kind" THEN
      PERFORM 1 FROM "qti"."section_variable_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_variable_ref_kind_alternatives_aqsuim3inz"() FROM PUBLIC;

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
        PERFORM 1 FROM "qti"."item_variable_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'itemInstanceVariable'::"qti"."ref_kind" THEN
        PERFORM 1 FROM "qti"."item_instance_variable_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'sectionDuration'::"qti"."ref_kind" THEN
        PERFORM 1 FROM "qti"."section_duration_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'templateParameter'::"qti"."ref_kind" THEN
        PERFORM 1 FROM "qti"."template_parameter_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariableRef",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariableRef"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'sectionVariable'::"qti"."ref_kind" THEN
        PERFORM 1 FROM "qti"."section_variable_ref" AS "r1" WHERE "r1"."id" = "p"."c1";
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

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_xv2ihge6mu"
  AFTER DELETE ON "qti"."item_instance_variable_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_azxxvv3rvr"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_rldwvxs6t2"
  AFTER DELETE ON "qti"."item_variable_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_vq6atunf3c"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_vuofxkclut"
  AFTER DELETE ON "qti"."section_duration_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_o4kmgjzkcg"();

CREATE CONSTRAINT TRIGGER "__law_variable_ref_kind_alternatives_pvolbauumr"
  AFTER DELETE ON "qti"."section_variable_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variable_ref_kind_alternatives_aqsuim3inz"();

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
  IF EXISTS (SELECT "r64"."c90" AS "id" FROM (SELECT "r9"."c13" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."kind" FROM "qti"."variable_ref" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c3" = 'declared'::"qti"."ref_kind") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."declaration_kind", "r5"."document", "r5"."id", "r5"."identifier", "r5"."referrer_kind" FROM "qti"."declared_ref" AS "r5") AS "r6"("c6", "c7", "c8", "c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c5")) AS "r9"("c13") UNION SELECT "r18"."c24" FROM (SELECT DISTINCT "r13"."c18" FROM (SELECT DISTINCT "r12"."c17" FROM (SELECT DISTINCT "r11"."c15" FROM (SELECT DISTINCT "r10"."document", "r10"."id", "r10"."kind" FROM "qti"."variable_ref" AS "r10") AS "r11"("c14", "c15", "c16") WHERE "r11"."c16" = 'builtIn'::"qti"."ref_kind") AS "r12"("c17")) AS "r13"("c18") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c19" FROM (SELECT DISTINCT "r14"."id", "r14"."name", "r14"."referrer_kind" FROM "qti"."built_in_ref" AS "r14") AS "r15"("c19", "c20", "c21")) AS "r16"("c22")) AS "r17"("c23") WHERE "r17"."c23" = "r13"."c18")) AS "r18"("c24") UNION SELECT "r27"."c37" FROM (SELECT DISTINCT "r22"."c29" FROM (SELECT DISTINCT "r21"."c28" FROM (SELECT DISTINCT "r20"."c26" FROM (SELECT DISTINCT "r19"."document", "r19"."id", "r19"."kind" FROM "qti"."variable_ref" AS "r19") AS "r20"("c25", "c26", "c27") WHERE "r20"."c27" = 'itemVariable'::"qti"."ref_kind") AS "r21"("c28")) AS "r22"("c29") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c35" FROM (SELECT DISTINCT "r24"."c31" FROM (SELECT DISTINCT "r23"."document", "r23"."id", "r23"."prefix", "r23"."root", "r23"."variable" FROM "qti"."item_variable_ref" AS "r23") AS "r24"("c30", "c31", "c32", "c33", "c34")) AS "r25"("c35")) AS "r26"("c36") WHERE "r26"."c36" = "r22"."c29")) AS "r27"("c37") UNION SELECT "r36"."c51" FROM (SELECT DISTINCT "r31"."c42" FROM (SELECT DISTINCT "r30"."c41" FROM (SELECT DISTINCT "r29"."c39" FROM (SELECT DISTINCT "r28"."document", "r28"."id", "r28"."kind" FROM "qti"."variable_ref" AS "r28") AS "r29"("c38", "c39", "c40") WHERE "r29"."c40" = 'itemInstanceVariable'::"qti"."ref_kind") AS "r30"("c41")) AS "r31"("c42") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c49" FROM (SELECT DISTINCT "r33"."c44" FROM (SELECT DISTINCT "r32"."document", "r32"."id", "r32"."instance", "r32"."prefix", "r32"."root", "r32"."variable" FROM "qti"."item_instance_variable_ref" AS "r32") AS "r33"("c43", "c44", "c45", "c46", "c47", "c48")) AS "r34"("c49")) AS "r35"("c50") WHERE "r35"."c50" = "r31"."c42")) AS "r36"("c51") UNION SELECT "r45"."c63" FROM (SELECT DISTINCT "r40"."c56" FROM (SELECT DISTINCT "r39"."c55" FROM (SELECT DISTINCT "r38"."c53" FROM (SELECT DISTINCT "r37"."document", "r37"."id", "r37"."kind" FROM "qti"."variable_ref" AS "r37") AS "r38"("c52", "c53", "c54") WHERE "r38"."c54" = 'sectionDuration'::"qti"."ref_kind") AS "r39"("c55")) AS "r40"("c56") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c61" FROM (SELECT DISTINCT "r42"."c58" FROM (SELECT DISTINCT "r41"."document", "r41"."id", "r41"."prefix", "r41"."root" FROM "qti"."section_duration_ref" AS "r41") AS "r42"("c57", "c58", "c59", "c60")) AS "r43"("c61")) AS "r44"("c62") WHERE "r44"."c62" = "r40"."c56")) AS "r45"("c63") UNION SELECT "r54"."c76" FROM (SELECT DISTINCT "r49"."c68" FROM (SELECT DISTINCT "r48"."c67" FROM (SELECT DISTINCT "r47"."c65" FROM (SELECT DISTINCT "r46"."document", "r46"."id", "r46"."kind" FROM "qti"."variable_ref" AS "r46") AS "r47"("c64", "c65", "c66") WHERE "r47"."c66" = 'templateParameter'::"qti"."ref_kind") AS "r48"("c67")) AS "r49"("c68") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r52"."c74" FROM (SELECT DISTINCT "r51"."c70" FROM (SELECT DISTINCT "r50"."document", "r50"."id", "r50"."identifier", "r50"."referrer_kind", "r50"."root_kind" FROM "qti"."template_parameter_ref" AS "r50") AS "r51"("c69", "c70", "c71", "c72", "c73")) AS "r52"("c74")) AS "r53"("c75") WHERE "r53"."c75" = "r49"."c68")) AS "r54"("c76") UNION SELECT "r63"."c89" FROM (SELECT DISTINCT "r58"."c81" FROM (SELECT DISTINCT "r57"."c80" FROM (SELECT DISTINCT "r56"."c78" FROM (SELECT DISTINCT "r55"."document", "r55"."id", "r55"."kind" FROM "qti"."variable_ref" AS "r55") AS "r56"("c77", "c78", "c79") WHERE "r56"."c79" = 'sectionVariable'::"qti"."ref_kind") AS "r57"("c80")) AS "r58"("c81") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r61"."c87" FROM (SELECT DISTINCT "r60"."c83" FROM (SELECT DISTINCT "r59"."document", "r59"."id", "r59"."identifier", "r59"."referrer_kind", "r59"."root" FROM "qti"."section_variable_ref" AS "r59") AS "r60"("c82", "c83", "c84", "c85", "c86")) AS "r61"("c87")) AS "r62"("c88") WHERE "r62"."c88" = "r58"."c81")) AS "r63"("c89")) AS "r64"("c90")) THEN
    RAISE EXCEPTION 'law __variable_ref_kind_alternatives_5tghedigzl is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__variable_ref_kind_alternatives_5tghedigzl'::"pg_catalog"."text";
  END IF;
END
$$;
