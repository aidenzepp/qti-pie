-- Validate law __prefixed_variable_source_source_alternatives_sfjy2dxlb3: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."prefixed_built_in", "qti"."prefixed_declared", "qti"."prefixed_mapped", "qti"."prefixed_variable_source" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_5pwxhqygbt"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."source" AS "c3" FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'builtIn'::"qti"."prefixed_source" THEN
      PERFORM 1 FROM "qti"."prefixed_built_in" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __prefixed_variable_source_source_alternatives_sfjy2dxlb3 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__prefixed_variable_source_source_alternatives_sfjy2dxlb3'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_5pwxhqygbt"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_gnzdoiib4j"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."source" AS "c3" FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'declared'::"qti"."prefixed_source" THEN
      PERFORM 1 FROM "qti"."prefixed_declared" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __prefixed_variable_source_source_alternatives_sfjy2dxlb3 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__prefixed_variable_source_source_alternatives_sfjy2dxlb3'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_gnzdoiib4j"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_os34htb5mq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."source" AS "c3" FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = OLD."ref" AND "r1"."test" = OLD."test" LOOP
    IF "p"."c3" = 'mapped'::"qti"."prefixed_source" THEN
      PERFORM 1 FROM "qti"."prefixed_mapped" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __prefixed_variable_source_source_alternatives_sfjy2dxlb3 violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__prefixed_variable_source_source_alternatives_sfjy2dxlb3'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_os34htb5mq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_hmh4jvvvxt"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."ref" AS "c1", "r1"."test" AS "c2", "r1"."source" AS "c3" FROM "qti"."prefixed_variable_source" AS "r1" WHERE "r1"."ref" = NEW."ref" AND "r1"."test" = NEW."test" LOOP
    CASE "p"."c3"
      WHEN 'declared'::"qti"."prefixed_source" THEN
        PERFORM 1 FROM "qti"."prefixed_declared" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __prefixed_variable_source_source_alternatives_sfjy2dxlb3 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__prefixed_variable_source_source_alternatives_sfjy2dxlb3'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'mapped'::"qti"."prefixed_source" THEN
        PERFORM 1 FROM "qti"."prefixed_mapped" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __prefixed_variable_source_source_alternatives_sfjy2dxlb3 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__prefixed_variable_source_source_alternatives_sfjy2dxlb3'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'builtIn'::"qti"."prefixed_source" THEN
        PERFORM 1 FROM "qti"."prefixed_built_in" AS "r1" WHERE "r1"."ref" = "p"."c1" AND "r1"."test" = "p"."c2";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __prefixed_variable_source_source_alternatives_sfjy2dxlb3 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__prefixed_variable_source_source_alternatives_sfjy2dxlb3'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["PrefixedVariableSource",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ','::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c2"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["PrefixedVariableSource"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_hmh4jvvvxt"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_prefixed_variable_source_source_alternatives_oznt3yzgbd"
  AFTER DELETE ON "qti"."prefixed_built_in"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_5pwxhqygbt"();

CREATE CONSTRAINT TRIGGER "__law_prefixed_variable_source_source_alternatives_ggj2uujort"
  AFTER DELETE ON "qti"."prefixed_declared"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_gnzdoiib4j"();

CREATE CONSTRAINT TRIGGER "__law_prefixed_variable_source_source_alternatives_vxo42ufy2m"
  AFTER DELETE ON "qti"."prefixed_mapped"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_os34htb5mq"();

CREATE CONSTRAINT TRIGGER "__law_prefixed_variable_source_source_alternatives_h2d5l2i3c3"
  AFTER INSERT ON "qti"."prefixed_variable_source"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_prefixed_variable_source_source_alternatives_hmh4jvvvxt"();

-- The full violation query of law __prefixed_variable_source_source_alternatives_sfjy2dxlb3.
DO $$
BEGIN
  IF EXISTS (SELECT "r28"."c66" AS "ref", "r28"."c67" AS "test" FROM (SELECT "r9"."c21", "r9"."c22" FROM (SELECT DISTINCT "r4"."c11", "r4"."c12" FROM (SELECT DISTINCT "r3"."c9", "r3"."c10" FROM (SELECT DISTINCT "r2"."c5", "r2"."c8" FROM (SELECT DISTINCT "r1"."document", "r1"."item_document", "r1"."item_ref", "r1"."prefix", "r1"."ref", "r1"."ref_kind", "r1"."source", "r1"."test" FROM "qti"."prefixed_variable_source" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8") WHERE "r2"."c7" = 'declared'::"qti"."prefixed_source") AS "r3"("c9", "c10")) AS "r4"("c11", "c12") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c14", "r6"."c15" FROM (SELECT DISTINCT "r5"."item_document", "r5"."ref", "r5"."test", "r5"."variable" FROM "qti"."prefixed_declared" AS "r5") AS "r6"("c13", "c14", "c15", "c16")) AS "r7"("c17", "c18")) AS "r8"("c19", "c20") WHERE "r8"."c19" = "r4"."c11" AND "r8"."c20" = "r4"."c12")) AS "r9"("c21", "c22") UNION SELECT "r18"."c43", "r18"."c44" FROM (SELECT DISTINCT "r13"."c33", "r13"."c34" FROM (SELECT DISTINCT "r12"."c31", "r12"."c32" FROM (SELECT DISTINCT "r11"."c27", "r11"."c30" FROM (SELECT DISTINCT "r10"."document", "r10"."item_document", "r10"."item_ref", "r10"."prefix", "r10"."ref", "r10"."ref_kind", "r10"."source", "r10"."test" FROM "qti"."prefixed_variable_source" AS "r10") AS "r11"("c23", "c24", "c25", "c26", "c27", "c28", "c29", "c30") WHERE "r11"."c29" = 'mapped'::"qti"."prefixed_source") AS "r12"("c31", "c32")) AS "r13"("c33", "c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c39", "r16"."c40" FROM (SELECT DISTINCT "r15"."c36", "r15"."c37" FROM (SELECT DISTINCT "r14"."item_ref", "r14"."ref", "r14"."test", "r14"."variable" FROM "qti"."prefixed_mapped" AS "r14") AS "r15"("c35", "c36", "c37", "c38")) AS "r16"("c39", "c40")) AS "r17"("c41", "c42") WHERE "r17"."c41" = "r13"."c33" AND "r17"."c42" = "r13"."c34")) AS "r18"("c43", "c44") UNION SELECT "r27"."c64", "r27"."c65" FROM (SELECT DISTINCT "r22"."c55", "r22"."c56" FROM (SELECT DISTINCT "r21"."c53", "r21"."c54" FROM (SELECT DISTINCT "r20"."c49", "r20"."c52" FROM (SELECT DISTINCT "r19"."document", "r19"."item_document", "r19"."item_ref", "r19"."prefix", "r19"."ref", "r19"."ref_kind", "r19"."source", "r19"."test" FROM "qti"."prefixed_variable_source" AS "r19") AS "r20"("c45", "c46", "c47", "c48", "c49", "c50", "c51", "c52") WHERE "r20"."c51" = 'builtIn'::"qti"."prefixed_source") AS "r21"("c53", "c54")) AS "r22"("c55", "c56") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c60", "r25"."c61" FROM (SELECT DISTINCT "r24"."c58", "r24"."c59" FROM (SELECT DISTINCT "r23"."built_in", "r23"."ref", "r23"."test" FROM "qti"."prefixed_built_in" AS "r23") AS "r24"("c57", "c58", "c59")) AS "r25"("c60", "c61")) AS "r26"("c62", "c63") WHERE "r26"."c62" = "r22"."c55" AND "r26"."c63" = "r22"."c56")) AS "r27"("c64", "c65")) AS "r28"("c66", "c67")) THEN
    RAISE EXCEPTION 'law __prefixed_variable_source_source_alternatives_sfjy2dxlb3 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__prefixed_variable_source_source_alternatives_sfjy2dxlb3'::"pg_catalog"."text";
  END IF;
END
$$;
