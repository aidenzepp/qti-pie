-- Validate law __literal_base_type_alternatives_nbu2ud5pvr: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."literal", "qti"."literal_boolean", "qti"."literal_directed_pair", "qti"."literal_duration", "qti"."literal_file", "qti"."literal_float", "qti"."literal_identifier", "qti"."literal_integer", "qti"."literal_pair", "qti"."literal_point", "qti"."literal_string", "qti"."literal_uri" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_mpyzofmbuw"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'boolean'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'integer'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'float'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'string'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'identifier'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'uri'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'duration'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'point'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'pair'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'directedPair'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'file'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."literal_file" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_mpyzofmbuw"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_naig3eavwc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'boolean'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_naig3eavwc"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_pkym5autpd"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'directedPair'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_pkym5autpd"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_a5wv5peffl"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'duration'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_a5wv5peffl"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_qtbvp4b55a"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'file'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_qtbvp4b55a"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_m2eupr67uv"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'float'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_float" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_m2eupr67uv"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_iru4zh6cul"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'identifier'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_iru4zh6cul"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_a54r7focvn"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'integer'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_a54r7focvn"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_gs62yllwoi"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'pair'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_gs62yllwoi"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_4pqbhb6lyj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'point'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_point" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_4pqbhb6lyj"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_2ii2wkmh2y"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'string'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_string" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_2ii2wkmh2y"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_literal_base_type_alternatives_r56svlrcu2"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."literal" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'uri'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."literal_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Literal",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Literal"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_literal_base_type_alternatives_r56svlrcu2"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_zrvnjipgh5"
  AFTER INSERT ON "qti"."literal"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_mpyzofmbuw"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_ixupjypeqv"
  AFTER DELETE ON "qti"."literal_boolean"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_naig3eavwc"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_nmk6iogvui"
  AFTER DELETE ON "qti"."literal_directed_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_pkym5autpd"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_vjz2n4dl6b"
  AFTER DELETE ON "qti"."literal_duration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_a5wv5peffl"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_cw7e3jtudf"
  AFTER DELETE ON "qti"."literal_file"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_qtbvp4b55a"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_drywgua3or"
  AFTER DELETE ON "qti"."literal_float"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_m2eupr67uv"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_ce3qk2lkxo"
  AFTER DELETE ON "qti"."literal_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_iru4zh6cul"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_htiajsfl54"
  AFTER DELETE ON "qti"."literal_integer"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_a54r7focvn"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_3ld32vin5s"
  AFTER DELETE ON "qti"."literal_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_gs62yllwoi"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_hcgnee5vga"
  AFTER DELETE ON "qti"."literal_point"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_4pqbhb6lyj"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_csosy45dad"
  AFTER DELETE ON "qti"."literal_string"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_2ii2wkmh2y"();

CREATE CONSTRAINT TRIGGER "__law_literal_base_type_alternatives_ycldr27fa5"
  AFTER DELETE ON "qti"."literal_uri"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_literal_base_type_alternatives_r56svlrcu2"();

-- The full violation query of law __literal_base_type_alternatives_nbu2ud5pvr.
DO $$
BEGIN
  IF EXISTS (SELECT "r100"."c100" AS "id" FROM (SELECT "r9"."c9" FROM (SELECT DISTINCT "r4"."c4" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."base_type", "r1"."id" FROM "qti"."literal" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c1" = 'boolean'::"qti"."base_type") AS "r3"("c3")) AS "r4"("c4") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c7" FROM (SELECT DISTINCT "r6"."c5" FROM (SELECT DISTINCT "r5"."id", "r5"."value" FROM "qti"."literal_boolean" AS "r5") AS "r6"("c5", "c6")) AS "r7"("c7")) AS "r8"("c8") WHERE "r8"."c8" = "r4"."c4")) AS "r9"("c9") UNION SELECT "r18"."c18" FROM (SELECT DISTINCT "r13"."c13" FROM (SELECT DISTINCT "r12"."c12" FROM (SELECT DISTINCT "r11"."c11" FROM (SELECT DISTINCT "r10"."base_type", "r10"."id" FROM "qti"."literal" AS "r10") AS "r11"("c10", "c11") WHERE "r11"."c10" = 'integer'::"qti"."base_type") AS "r12"("c12")) AS "r13"("c13") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c16" FROM (SELECT DISTINCT "r15"."c14" FROM (SELECT DISTINCT "r14"."id", "r14"."value" FROM "qti"."literal_integer" AS "r14") AS "r15"("c14", "c15")) AS "r16"("c16")) AS "r17"("c17") WHERE "r17"."c17" = "r13"."c13")) AS "r18"("c18") UNION SELECT "r27"."c27" FROM (SELECT DISTINCT "r22"."c22" FROM (SELECT DISTINCT "r21"."c21" FROM (SELECT DISTINCT "r20"."c20" FROM (SELECT DISTINCT "r19"."base_type", "r19"."id" FROM "qti"."literal" AS "r19") AS "r20"("c19", "c20") WHERE "r20"."c19" = 'float'::"qti"."base_type") AS "r21"("c21")) AS "r22"("c22") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c25" FROM (SELECT DISTINCT "r24"."c23" FROM (SELECT DISTINCT "r23"."id", "r23"."value" FROM "qti"."literal_float" AS "r23") AS "r24"("c23", "c24")) AS "r25"("c25")) AS "r26"("c26") WHERE "r26"."c26" = "r22"."c22")) AS "r27"("c27") UNION SELECT "r36"."c36" FROM (SELECT DISTINCT "r31"."c31" FROM (SELECT DISTINCT "r30"."c30" FROM (SELECT DISTINCT "r29"."c29" FROM (SELECT DISTINCT "r28"."base_type", "r28"."id" FROM "qti"."literal" AS "r28") AS "r29"("c28", "c29") WHERE "r29"."c28" = 'string'::"qti"."base_type") AS "r30"("c30")) AS "r31"("c31") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c34" FROM (SELECT DISTINCT "r33"."c32" FROM (SELECT DISTINCT "r32"."id", "r32"."value" FROM "qti"."literal_string" AS "r32") AS "r33"("c32", "c33")) AS "r34"("c34")) AS "r35"("c35") WHERE "r35"."c35" = "r31"."c31")) AS "r36"("c36") UNION SELECT "r45"."c45" FROM (SELECT DISTINCT "r40"."c40" FROM (SELECT DISTINCT "r39"."c39" FROM (SELECT DISTINCT "r38"."c38" FROM (SELECT DISTINCT "r37"."base_type", "r37"."id" FROM "qti"."literal" AS "r37") AS "r38"("c37", "c38") WHERE "r38"."c37" = 'identifier'::"qti"."base_type") AS "r39"("c39")) AS "r40"("c40") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c43" FROM (SELECT DISTINCT "r42"."c41" FROM (SELECT DISTINCT "r41"."id", "r41"."value" FROM "qti"."literal_identifier" AS "r41") AS "r42"("c41", "c42")) AS "r43"("c43")) AS "r44"("c44") WHERE "r44"."c44" = "r40"."c40")) AS "r45"("c45") UNION SELECT "r54"."c54" FROM (SELECT DISTINCT "r49"."c49" FROM (SELECT DISTINCT "r48"."c48" FROM (SELECT DISTINCT "r47"."c47" FROM (SELECT DISTINCT "r46"."base_type", "r46"."id" FROM "qti"."literal" AS "r46") AS "r47"("c46", "c47") WHERE "r47"."c46" = 'uri'::"qti"."base_type") AS "r48"("c48")) AS "r49"("c49") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r52"."c52" FROM (SELECT DISTINCT "r51"."c50" FROM (SELECT DISTINCT "r50"."id", "r50"."value" FROM "qti"."literal_uri" AS "r50") AS "r51"("c50", "c51")) AS "r52"("c52")) AS "r53"("c53") WHERE "r53"."c53" = "r49"."c49")) AS "r54"("c54") UNION SELECT "r63"."c63" FROM (SELECT DISTINCT "r58"."c58" FROM (SELECT DISTINCT "r57"."c57" FROM (SELECT DISTINCT "r56"."c56" FROM (SELECT DISTINCT "r55"."base_type", "r55"."id" FROM "qti"."literal" AS "r55") AS "r56"("c55", "c56") WHERE "r56"."c55" = 'duration'::"qti"."base_type") AS "r57"("c57")) AS "r58"("c58") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r61"."c61" FROM (SELECT DISTINCT "r60"."c59" FROM (SELECT DISTINCT "r59"."id", "r59"."value" FROM "qti"."literal_duration" AS "r59") AS "r60"("c59", "c60")) AS "r61"("c61")) AS "r62"("c62") WHERE "r62"."c62" = "r58"."c58")) AS "r63"("c63") UNION SELECT "r72"."c72" FROM (SELECT DISTINCT "r67"."c67" FROM (SELECT DISTINCT "r66"."c66" FROM (SELECT DISTINCT "r65"."c65" FROM (SELECT DISTINCT "r64"."base_type", "r64"."id" FROM "qti"."literal" AS "r64") AS "r65"("c64", "c65") WHERE "r65"."c64" = 'point'::"qti"."base_type") AS "r66"("c66")) AS "r67"("c67") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r70"."c70" FROM (SELECT DISTINCT "r69"."c68" FROM (SELECT DISTINCT "r68"."id", "r68"."value" FROM "qti"."literal_point" AS "r68") AS "r69"("c68", "c69")) AS "r70"("c70")) AS "r71"("c71") WHERE "r71"."c71" = "r67"."c67")) AS "r72"("c72") UNION SELECT "r81"."c81" FROM (SELECT DISTINCT "r76"."c76" FROM (SELECT DISTINCT "r75"."c75" FROM (SELECT DISTINCT "r74"."c74" FROM (SELECT DISTINCT "r73"."base_type", "r73"."id" FROM "qti"."literal" AS "r73") AS "r74"("c73", "c74") WHERE "r74"."c73" = 'pair'::"qti"."base_type") AS "r75"("c75")) AS "r76"("c76") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r79"."c79" FROM (SELECT DISTINCT "r78"."c77" FROM (SELECT DISTINCT "r77"."id", "r77"."value" FROM "qti"."literal_pair" AS "r77") AS "r78"("c77", "c78")) AS "r79"("c79")) AS "r80"("c80") WHERE "r80"."c80" = "r76"."c76")) AS "r81"("c81") UNION SELECT "r90"."c90" FROM (SELECT DISTINCT "r85"."c85" FROM (SELECT DISTINCT "r84"."c84" FROM (SELECT DISTINCT "r83"."c83" FROM (SELECT DISTINCT "r82"."base_type", "r82"."id" FROM "qti"."literal" AS "r82") AS "r83"("c82", "c83") WHERE "r83"."c82" = 'directedPair'::"qti"."base_type") AS "r84"("c84")) AS "r85"("c85") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r88"."c88" FROM (SELECT DISTINCT "r87"."c86" FROM (SELECT DISTINCT "r86"."id", "r86"."value" FROM "qti"."literal_directed_pair" AS "r86") AS "r87"("c86", "c87")) AS "r88"("c88")) AS "r89"("c89") WHERE "r89"."c89" = "r85"."c85")) AS "r90"("c90") UNION SELECT "r99"."c99" FROM (SELECT DISTINCT "r94"."c94" FROM (SELECT DISTINCT "r93"."c93" FROM (SELECT DISTINCT "r92"."c92" FROM (SELECT DISTINCT "r91"."base_type", "r91"."id" FROM "qti"."literal" AS "r91") AS "r92"("c91", "c92") WHERE "r92"."c91" = 'file'::"qti"."base_type") AS "r93"("c93")) AS "r94"("c94") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r97"."c97" FROM (SELECT DISTINCT "r96"."c95" FROM (SELECT DISTINCT "r95"."id", "r95"."value" FROM "qti"."literal_file" AS "r95") AS "r96"("c95", "c96")) AS "r97"("c97")) AS "r98"("c98") WHERE "r98"."c98" = "r94"."c94")) AS "r99"("c99")) AS "r100"("c100")) THEN
    RAISE EXCEPTION 'law __literal_base_type_alternatives_nbu2ud5pvr is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__literal_base_type_alternatives_nbu2ud5pvr'::"pg_catalog"."text";
  END IF;
END
$$;
