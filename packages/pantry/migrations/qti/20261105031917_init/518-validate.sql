-- Validate law __usage_typed_value_base_type_alternatives_5xycpqav6l: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."usage_typed_value", "qti"."usage_typed_value_boolean", "qti"."usage_typed_value_directed_pair", "qti"."usage_typed_value_duration", "qti"."usage_typed_value_file", "qti"."usage_typed_value_float", "qti"."usage_typed_value_identifier", "qti"."usage_typed_value_integer", "qti"."usage_typed_value_pair", "qti"."usage_typed_value_point", "qti"."usage_typed_value_string", "qti"."usage_typed_value_uri" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_5dxppuap45"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'boolean'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'integer'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'float'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'string'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'identifier'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'uri'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'duration'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'point'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'pair'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'directedPair'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'file'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."usage_typed_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_5dxppuap45"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_ba37gmzjpl"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'boolean'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_ba37gmzjpl"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_qg2uv7ggss"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'directedPair'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_qg2uv7ggss"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_oh76cpy2nw"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'duration'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_oh76cpy2nw"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_sjzkpavwik"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'file'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_sjzkpavwik"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_u2rqyoly7s"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'float'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_float" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_u2rqyoly7s"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_skbiumfucq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'identifier'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_skbiumfucq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_k5snuc7avq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'integer'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_k5snuc7avq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_hxratgljvn"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'pair'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_hxratgljvn"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_dyvsg2hcey"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'point'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_point" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_dyvsg2hcey"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_vryzshxxiu"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'string'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_string" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_vryzshxxiu"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_zzujmzqfhm"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."usage_typed_value" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'uri'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."usage_typed_value_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["UsageTypedValue",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["UsageTypedValue"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_zzujmzqfhm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_jw5ex5bn4p"
  AFTER INSERT ON "qti"."usage_typed_value"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_5dxppuap45"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_6onjxn42oq"
  AFTER DELETE ON "qti"."usage_typed_value_boolean"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_ba37gmzjpl"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_hixuxgxo76"
  AFTER DELETE ON "qti"."usage_typed_value_directed_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_qg2uv7ggss"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_supecy7vs7"
  AFTER DELETE ON "qti"."usage_typed_value_duration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_oh76cpy2nw"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_n7kxuzdnja"
  AFTER DELETE ON "qti"."usage_typed_value_file"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_sjzkpavwik"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_xafgqu7fpi"
  AFTER DELETE ON "qti"."usage_typed_value_float"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_u2rqyoly7s"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_sr4jumbjkw"
  AFTER DELETE ON "qti"."usage_typed_value_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_skbiumfucq"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_txna5qijl6"
  AFTER DELETE ON "qti"."usage_typed_value_integer"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_k5snuc7avq"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_flzslnenmv"
  AFTER DELETE ON "qti"."usage_typed_value_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_hxratgljvn"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_fj5vnsowpf"
  AFTER DELETE ON "qti"."usage_typed_value_point"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_dyvsg2hcey"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_2zqowcxqip"
  AFTER DELETE ON "qti"."usage_typed_value_string"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_vryzshxxiu"();

CREATE CONSTRAINT TRIGGER "__law_usage_typed_value_base_type_alternatives_nunz2mefpo"
  AFTER DELETE ON "qti"."usage_typed_value_uri"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_usage_typed_value_base_type_alternatives_zzujmzqfhm"();

-- The full violation query of law __usage_typed_value_base_type_alternatives_5xycpqav6l.
DO $$
BEGIN
  IF EXISTS (SELECT "r100"."c111" AS "id" FROM (SELECT "r9"."c10" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."base_type", "r1"."id", "r1"."value" FROM "qti"."usage_typed_value" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c1" = 'boolean'::"qti"."base_type") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c8" FROM (SELECT DISTINCT "r6"."c6" FROM (SELECT DISTINCT "r5"."id", "r5"."value" FROM "qti"."usage_typed_value_boolean" AS "r5") AS "r6"("c6", "c7")) AS "r7"("c8")) AS "r8"("c9") WHERE "r8"."c9" = "r4"."c5")) AS "r9"("c10") UNION SELECT "r18"."c20" FROM (SELECT DISTINCT "r13"."c15" FROM (SELECT DISTINCT "r12"."c14" FROM (SELECT DISTINCT "r11"."c12" FROM (SELECT DISTINCT "r10"."base_type", "r10"."id", "r10"."value" FROM "qti"."usage_typed_value" AS "r10") AS "r11"("c11", "c12", "c13") WHERE "r11"."c11" = 'integer'::"qti"."base_type") AS "r12"("c14")) AS "r13"("c15") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c18" FROM (SELECT DISTINCT "r15"."c16" FROM (SELECT DISTINCT "r14"."id", "r14"."value" FROM "qti"."usage_typed_value_integer" AS "r14") AS "r15"("c16", "c17")) AS "r16"("c18")) AS "r17"("c19") WHERE "r17"."c19" = "r13"."c15")) AS "r18"("c20") UNION SELECT "r27"."c30" FROM (SELECT DISTINCT "r22"."c25" FROM (SELECT DISTINCT "r21"."c24" FROM (SELECT DISTINCT "r20"."c22" FROM (SELECT DISTINCT "r19"."base_type", "r19"."id", "r19"."value" FROM "qti"."usage_typed_value" AS "r19") AS "r20"("c21", "c22", "c23") WHERE "r20"."c21" = 'float'::"qti"."base_type") AS "r21"("c24")) AS "r22"("c25") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c28" FROM (SELECT DISTINCT "r24"."c26" FROM (SELECT DISTINCT "r23"."id", "r23"."value" FROM "qti"."usage_typed_value_float" AS "r23") AS "r24"("c26", "c27")) AS "r25"("c28")) AS "r26"("c29") WHERE "r26"."c29" = "r22"."c25")) AS "r27"("c30") UNION SELECT "r36"."c40" FROM (SELECT DISTINCT "r31"."c35" FROM (SELECT DISTINCT "r30"."c34" FROM (SELECT DISTINCT "r29"."c32" FROM (SELECT DISTINCT "r28"."base_type", "r28"."id", "r28"."value" FROM "qti"."usage_typed_value" AS "r28") AS "r29"("c31", "c32", "c33") WHERE "r29"."c31" = 'string'::"qti"."base_type") AS "r30"("c34")) AS "r31"("c35") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c38" FROM (SELECT DISTINCT "r33"."c36" FROM (SELECT DISTINCT "r32"."id", "r32"."value" FROM "qti"."usage_typed_value_string" AS "r32") AS "r33"("c36", "c37")) AS "r34"("c38")) AS "r35"("c39") WHERE "r35"."c39" = "r31"."c35")) AS "r36"("c40") UNION SELECT "r45"."c50" FROM (SELECT DISTINCT "r40"."c45" FROM (SELECT DISTINCT "r39"."c44" FROM (SELECT DISTINCT "r38"."c42" FROM (SELECT DISTINCT "r37"."base_type", "r37"."id", "r37"."value" FROM "qti"."usage_typed_value" AS "r37") AS "r38"("c41", "c42", "c43") WHERE "r38"."c41" = 'identifier'::"qti"."base_type") AS "r39"("c44")) AS "r40"("c45") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c48" FROM (SELECT DISTINCT "r42"."c46" FROM (SELECT DISTINCT "r41"."id", "r41"."value" FROM "qti"."usage_typed_value_identifier" AS "r41") AS "r42"("c46", "c47")) AS "r43"("c48")) AS "r44"("c49") WHERE "r44"."c49" = "r40"."c45")) AS "r45"("c50") UNION SELECT "r54"."c60" FROM (SELECT DISTINCT "r49"."c55" FROM (SELECT DISTINCT "r48"."c54" FROM (SELECT DISTINCT "r47"."c52" FROM (SELECT DISTINCT "r46"."base_type", "r46"."id", "r46"."value" FROM "qti"."usage_typed_value" AS "r46") AS "r47"("c51", "c52", "c53") WHERE "r47"."c51" = 'uri'::"qti"."base_type") AS "r48"("c54")) AS "r49"("c55") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r52"."c58" FROM (SELECT DISTINCT "r51"."c56" FROM (SELECT DISTINCT "r50"."id", "r50"."value" FROM "qti"."usage_typed_value_uri" AS "r50") AS "r51"("c56", "c57")) AS "r52"("c58")) AS "r53"("c59") WHERE "r53"."c59" = "r49"."c55")) AS "r54"("c60") UNION SELECT "r63"."c70" FROM (SELECT DISTINCT "r58"."c65" FROM (SELECT DISTINCT "r57"."c64" FROM (SELECT DISTINCT "r56"."c62" FROM (SELECT DISTINCT "r55"."base_type", "r55"."id", "r55"."value" FROM "qti"."usage_typed_value" AS "r55") AS "r56"("c61", "c62", "c63") WHERE "r56"."c61" = 'duration'::"qti"."base_type") AS "r57"("c64")) AS "r58"("c65") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r61"."c68" FROM (SELECT DISTINCT "r60"."c66" FROM (SELECT DISTINCT "r59"."id", "r59"."value" FROM "qti"."usage_typed_value_duration" AS "r59") AS "r60"("c66", "c67")) AS "r61"("c68")) AS "r62"("c69") WHERE "r62"."c69" = "r58"."c65")) AS "r63"("c70") UNION SELECT "r72"."c80" FROM (SELECT DISTINCT "r67"."c75" FROM (SELECT DISTINCT "r66"."c74" FROM (SELECT DISTINCT "r65"."c72" FROM (SELECT DISTINCT "r64"."base_type", "r64"."id", "r64"."value" FROM "qti"."usage_typed_value" AS "r64") AS "r65"("c71", "c72", "c73") WHERE "r65"."c71" = 'point'::"qti"."base_type") AS "r66"("c74")) AS "r67"("c75") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r70"."c78" FROM (SELECT DISTINCT "r69"."c76" FROM (SELECT DISTINCT "r68"."id", "r68"."value" FROM "qti"."usage_typed_value_point" AS "r68") AS "r69"("c76", "c77")) AS "r70"("c78")) AS "r71"("c79") WHERE "r71"."c79" = "r67"."c75")) AS "r72"("c80") UNION SELECT "r81"."c90" FROM (SELECT DISTINCT "r76"."c85" FROM (SELECT DISTINCT "r75"."c84" FROM (SELECT DISTINCT "r74"."c82" FROM (SELECT DISTINCT "r73"."base_type", "r73"."id", "r73"."value" FROM "qti"."usage_typed_value" AS "r73") AS "r74"("c81", "c82", "c83") WHERE "r74"."c81" = 'pair'::"qti"."base_type") AS "r75"("c84")) AS "r76"("c85") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r79"."c88" FROM (SELECT DISTINCT "r78"."c86" FROM (SELECT DISTINCT "r77"."id", "r77"."value" FROM "qti"."usage_typed_value_pair" AS "r77") AS "r78"("c86", "c87")) AS "r79"("c88")) AS "r80"("c89") WHERE "r80"."c89" = "r76"."c85")) AS "r81"("c90") UNION SELECT "r90"."c100" FROM (SELECT DISTINCT "r85"."c95" FROM (SELECT DISTINCT "r84"."c94" FROM (SELECT DISTINCT "r83"."c92" FROM (SELECT DISTINCT "r82"."base_type", "r82"."id", "r82"."value" FROM "qti"."usage_typed_value" AS "r82") AS "r83"("c91", "c92", "c93") WHERE "r83"."c91" = 'directedPair'::"qti"."base_type") AS "r84"("c94")) AS "r85"("c95") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r88"."c98" FROM (SELECT DISTINCT "r87"."c96" FROM (SELECT DISTINCT "r86"."id", "r86"."value" FROM "qti"."usage_typed_value_directed_pair" AS "r86") AS "r87"("c96", "c97")) AS "r88"("c98")) AS "r89"("c99") WHERE "r89"."c99" = "r85"."c95")) AS "r90"("c100") UNION SELECT "r99"."c110" FROM (SELECT DISTINCT "r94"."c105" FROM (SELECT DISTINCT "r93"."c104" FROM (SELECT DISTINCT "r92"."c102" FROM (SELECT DISTINCT "r91"."base_type", "r91"."id", "r91"."value" FROM "qti"."usage_typed_value" AS "r91") AS "r92"("c101", "c102", "c103") WHERE "r92"."c101" = 'file'::"qti"."base_type") AS "r93"("c104")) AS "r94"("c105") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r97"."c108" FROM (SELECT DISTINCT "r96"."c106" FROM (SELECT DISTINCT "r95"."id", "r95"."value" FROM "qti"."usage_typed_value_file" AS "r95") AS "r96"("c106", "c107")) AS "r97"("c108")) AS "r98"("c109") WHERE "r98"."c109" = "r94"."c105")) AS "r99"("c110")) AS "r100"("c111")) THEN
    RAISE EXCEPTION 'law __usage_typed_value_base_type_alternatives_5xycpqav6l is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__usage_typed_value_base_type_alternatives_5xycpqav6l'::"pg_catalog"."text";
  END IF;
END
$$;
