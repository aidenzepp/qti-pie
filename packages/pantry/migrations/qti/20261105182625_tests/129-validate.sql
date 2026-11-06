-- Validate law __section_variable_resolution_target_alternatives_v45b6vacwr: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."section_variable_declared", "qti"."section_variable_duration", "qti"."section_variable_prefixed", "qti"."section_variable_resolution" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_section_variable_resolution_target_elkn5ajqjg"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."target" AS "c3" FROM "qti"."section_variable_resolution" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'declared'::"qti"."section_variable_target" THEN
      PERFORM 1 FROM "qti"."section_variable_declared" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __section_variable_resolution_target_alternatives_v45b6vacwr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__section_variable_resolution_target_alternatives_v45b6vacwr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionVariableResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionVariableResolution"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_variable_resolution_target_elkn5ajqjg"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_section_variable_resolution_target_2bjklu2dlu"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."target" AS "c3" FROM "qti"."section_variable_resolution" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'duration'::"qti"."section_variable_target" THEN
      PERFORM 1 FROM "qti"."section_variable_duration" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __section_variable_resolution_target_alternatives_v45b6vacwr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__section_variable_resolution_target_alternatives_v45b6vacwr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionVariableResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionVariableResolution"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_variable_resolution_target_2bjklu2dlu"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_section_variable_resolution_target_jkoolfkvim"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."target" AS "c3" FROM "qti"."section_variable_resolution" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'prefixed'::"qti"."section_variable_target" THEN
      PERFORM 1 FROM "qti"."section_variable_prefixed" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __section_variable_resolution_target_alternatives_v45b6vacwr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__section_variable_resolution_target_alternatives_v45b6vacwr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionVariableResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionVariableResolution"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_variable_resolution_target_jkoolfkvim"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_section_variable_resolution_target_kf3vmsx4tg"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."target" AS "c3" FROM "qti"."section_variable_resolution" AS "r1" WHERE "r1"."ref" = NEW."ref" AND "r1"."test" = NEW."test" LOOP
    CASE "p"."c3"
      WHEN 'declared'::"qti"."section_variable_target" THEN
        PERFORM 1 FROM "qti"."section_variable_declared" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __section_variable_resolution_target_alternatives_v45b6vacwr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__section_variable_resolution_target_alternatives_v45b6vacwr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionVariableResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionVariableResolution"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'prefixed'::"qti"."section_variable_target" THEN
        PERFORM 1 FROM "qti"."section_variable_prefixed" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __section_variable_resolution_target_alternatives_v45b6vacwr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__section_variable_resolution_target_alternatives_v45b6vacwr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionVariableResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionVariableResolution"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'duration'::"qti"."section_variable_target" THEN
        PERFORM 1 FROM "qti"."section_variable_duration" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __section_variable_resolution_target_alternatives_v45b6vacwr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__section_variable_resolution_target_alternatives_v45b6vacwr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["SectionVariableResolution",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["SectionVariableResolution"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_section_variable_resolution_target_kf3vmsx4tg"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_section_variable_resolution_target_uihluapwj3"
  AFTER DELETE ON "qti"."section_variable_declared"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_section_variable_resolution_target_elkn5ajqjg"();

CREATE CONSTRAINT TRIGGER "__law_section_variable_resolution_target_voo6de6564"
  AFTER DELETE ON "qti"."section_variable_duration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_section_variable_resolution_target_2bjklu2dlu"();

CREATE CONSTRAINT TRIGGER "__law_section_variable_resolution_target_ihelv6wfyt"
  AFTER DELETE ON "qti"."section_variable_prefixed"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_section_variable_resolution_target_jkoolfkvim"();

CREATE CONSTRAINT TRIGGER "__law_section_variable_resolution_target_4khnhllrto"
  AFTER INSERT ON "qti"."section_variable_resolution"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_section_variable_resolution_target_kf3vmsx4tg"();

-- The full violation query of law __section_variable_resolution_target_alternatives_v45b6vacwr.
DO $$
BEGIN
  IF EXISTS (SELECT "r28"."c52" AS "ref", "r28"."c53" AS "test" FROM (SELECT "r9"."c18", "r9"."c19" FROM (SELECT DISTINCT "r4"."c7", "r4"."c8" FROM (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c2", "r2"."c4" FROM (SELECT DISTINCT "r1"."document", "r1"."ref", "r1"."target", "r1"."test" FROM "qti"."section_variable_resolution" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c3" = 'declared'::"qti"."section_variable_target") AS "r3"("c5", "c6")) AS "r4"("c7", "c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c11", "r6"."c13" FROM (SELECT DISTINCT "r5"."declaration_kind", "r5"."identifier", "r5"."ref", "r5"."referrer_kind", "r5"."test" FROM "qti"."section_variable_declared" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13")) AS "r7"("c14", "c15")) AS "r8"("c16", "c17") WHERE "r8"."c16" = "r4"."c7" AND "r8"."c17" = "r4"."c8")) AS "r9"("c18", "c19") UNION SELECT "r18"."c34", "r18"."c35" FROM (SELECT DISTINCT "r13"."c26", "r13"."c27" FROM (SELECT DISTINCT "r12"."c24", "r12"."c25" FROM (SELECT DISTINCT "r11"."c21", "r11"."c23" FROM (SELECT DISTINCT "r10"."document", "r10"."ref", "r10"."target", "r10"."test" FROM "qti"."section_variable_resolution" AS "r10") AS "r11"("c20", "c21", "c22", "c23") WHERE "r11"."c22" = 'prefixed'::"qti"."section_variable_target") AS "r12"("c24", "c25")) AS "r13"("c26", "c27") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c30", "r16"."c31" FROM (SELECT DISTINCT "r15"."c28", "r15"."c29" FROM (SELECT DISTINCT "r14"."ref", "r14"."test" FROM "qti"."section_variable_prefixed" AS "r14") AS "r15"("c28", "c29")) AS "r16"("c30", "c31")) AS "r17"("c32", "c33") WHERE "r17"."c32" = "r13"."c26" AND "r17"."c33" = "r13"."c27")) AS "r18"("c34", "c35") UNION SELECT "r27"."c50", "r27"."c51" FROM (SELECT DISTINCT "r22"."c42", "r22"."c43" FROM (SELECT DISTINCT "r21"."c40", "r21"."c41" FROM (SELECT DISTINCT "r20"."c37", "r20"."c39" FROM (SELECT DISTINCT "r19"."document", "r19"."ref", "r19"."target", "r19"."test" FROM "qti"."section_variable_resolution" AS "r19") AS "r20"("c36", "c37", "c38", "c39") WHERE "r20"."c38" = 'duration'::"qti"."section_variable_target") AS "r21"("c40", "c41")) AS "r22"("c42", "c43") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c46", "r25"."c47" FROM (SELECT DISTINCT "r24"."c44", "r24"."c45" FROM (SELECT DISTINCT "r23"."ref", "r23"."test" FROM "qti"."section_variable_duration" AS "r23") AS "r24"("c44", "c45")) AS "r25"("c46", "c47")) AS "r26"("c48", "c49") WHERE "r26"."c48" = "r22"."c42" AND "r26"."c49" = "r22"."c43")) AS "r27"("c50", "c51")) AS "r28"("c52", "c53")) THEN
    RAISE EXCEPTION 'law __section_variable_resolution_target_alternatives_v45b6vacwr is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__section_variable_resolution_target_alternatives_v45b6vacwr'::"pg_catalog"."text";
  END IF;
END
$$;
