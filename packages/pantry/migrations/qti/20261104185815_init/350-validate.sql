-- Validate law __match_table_entry_base_type_alternatives_nyt6h5jjas: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."match_table_entry", "qti"."match_table_entry_boolean", "qti"."match_table_entry_directed_pair", "qti"."match_table_entry_duration", "qti"."match_table_entry_file", "qti"."match_table_entry_float", "qti"."match_table_entry_identifier", "qti"."match_table_entry_integer", "qti"."match_table_entry_pair", "qti"."match_table_entry_point", "qti"."match_table_entry_string", "qti"."match_table_entry_uri" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_hzctxz5vl4"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'boolean'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'integer'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'float'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'string'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'identifier'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'uri'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'duration'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'point'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'pair'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'directedPair'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'file'::"qti"."base_type" THEN
        PERFORM 1 FROM "qti"."match_table_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_hzctxz5vl4"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_khzj722c4c"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'boolean'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_boolean" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_khzj722c4c"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_rufve4vy32"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'directedPair'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_directed_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_rufve4vy32"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fj3ngenhi6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'duration'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_duration" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fj3ngenhi6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_wwhghntana"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'file'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_file" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_wwhghntana"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fwgrrva4cp"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'float'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_float" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fwgrrva4cp"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_s7um2niogf"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'identifier'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_identifier" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_s7um2niogf"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_i4jp3ob5pf"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'integer'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_integer" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_i4jp3ob5pf"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_sf673z6azo"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'pair'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_pair" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_sf673z6azo"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fz7uuqe2ri"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'point'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_point" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fz7uuqe2ri"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_mo6wlsd3k6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'string'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_string" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_mo6wlsd3k6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_otk27nhrso"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."base_type" AS "c2" FROM "qti"."match_table_entry" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'uri'::"qti"."base_type" THEN
      PERFORM 1 FROM "qti"."match_table_entry_uri" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchTableEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchTableEntry"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_otk27nhrso"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_o5cmypsmwg"
  AFTER INSERT ON "qti"."match_table_entry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_hzctxz5vl4"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_o4awl4yoqr"
  AFTER DELETE ON "qti"."match_table_entry_boolean"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_khzj722c4c"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_io4znfejbu"
  AFTER DELETE ON "qti"."match_table_entry_directed_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_rufve4vy32"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_sttr2c2c4d"
  AFTER DELETE ON "qti"."match_table_entry_duration"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fj3ngenhi6"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_rhm2ur6xmo"
  AFTER DELETE ON "qti"."match_table_entry_file"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_wwhghntana"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_3l7oa45gyd"
  AFTER DELETE ON "qti"."match_table_entry_float"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fwgrrva4cp"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_cv6z4bqemk"
  AFTER DELETE ON "qti"."match_table_entry_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_s7um2niogf"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_g4qvt7io5p"
  AFTER DELETE ON "qti"."match_table_entry_integer"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_i4jp3ob5pf"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_4smeaw7hfi"
  AFTER DELETE ON "qti"."match_table_entry_pair"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_sf673z6azo"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_gt2kix33yg"
  AFTER DELETE ON "qti"."match_table_entry_point"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_fz7uuqe2ri"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_vkk3aqfn55"
  AFTER DELETE ON "qti"."match_table_entry_string"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_mo6wlsd3k6"();

CREATE CONSTRAINT TRIGGER "__law_match_table_entry_base_type_alternatives_3ritcm2jxk"
  AFTER DELETE ON "qti"."match_table_entry_uri"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_table_entry_base_type_alternatives_otk27nhrso"();

-- The full violation query of law __match_table_entry_base_type_alternatives_nyt6h5jjas.
DO $$
BEGIN
  IF EXISTS (SELECT "r100"."c144" AS "id" FROM (SELECT "r9"."c13" FROM (SELECT DISTINCT "r4"."c8" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."base_type", "r1"."declaration", "r1"."id", "r1"."position", "r1"."source_value", "r1"."table" FROM "qti"."match_table_entry" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6") WHERE "r2"."c1" = 'boolean'::"qti"."base_type") AS "r3"("c7")) AS "r4"("c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c11" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."id", "r5"."target_value" FROM "qti"."match_table_entry_boolean" AS "r5") AS "r6"("c9", "c10")) AS "r7"("c11")) AS "r8"("c12") WHERE "r8"."c12" = "r4"."c8")) AS "r9"("c13") UNION SELECT "r18"."c26" FROM (SELECT DISTINCT "r13"."c21" FROM (SELECT DISTINCT "r12"."c20" FROM (SELECT DISTINCT "r11"."c16" FROM (SELECT DISTINCT "r10"."base_type", "r10"."declaration", "r10"."id", "r10"."position", "r10"."source_value", "r10"."table" FROM "qti"."match_table_entry" AS "r10") AS "r11"("c14", "c15", "c16", "c17", "c18", "c19") WHERE "r11"."c14" = 'integer'::"qti"."base_type") AS "r12"("c20")) AS "r13"("c21") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c24" FROM (SELECT DISTINCT "r15"."c22" FROM (SELECT DISTINCT "r14"."id", "r14"."target_value" FROM "qti"."match_table_entry_integer" AS "r14") AS "r15"("c22", "c23")) AS "r16"("c24")) AS "r17"("c25") WHERE "r17"."c25" = "r13"."c21")) AS "r18"("c26") UNION SELECT "r27"."c39" FROM (SELECT DISTINCT "r22"."c34" FROM (SELECT DISTINCT "r21"."c33" FROM (SELECT DISTINCT "r20"."c29" FROM (SELECT DISTINCT "r19"."base_type", "r19"."declaration", "r19"."id", "r19"."position", "r19"."source_value", "r19"."table" FROM "qti"."match_table_entry" AS "r19") AS "r20"("c27", "c28", "c29", "c30", "c31", "c32") WHERE "r20"."c27" = 'float'::"qti"."base_type") AS "r21"("c33")) AS "r22"("c34") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c37" FROM (SELECT DISTINCT "r24"."c35" FROM (SELECT DISTINCT "r23"."id", "r23"."target_value" FROM "qti"."match_table_entry_float" AS "r23") AS "r24"("c35", "c36")) AS "r25"("c37")) AS "r26"("c38") WHERE "r26"."c38" = "r22"."c34")) AS "r27"("c39") UNION SELECT "r36"."c52" FROM (SELECT DISTINCT "r31"."c47" FROM (SELECT DISTINCT "r30"."c46" FROM (SELECT DISTINCT "r29"."c42" FROM (SELECT DISTINCT "r28"."base_type", "r28"."declaration", "r28"."id", "r28"."position", "r28"."source_value", "r28"."table" FROM "qti"."match_table_entry" AS "r28") AS "r29"("c40", "c41", "c42", "c43", "c44", "c45") WHERE "r29"."c40" = 'string'::"qti"."base_type") AS "r30"("c46")) AS "r31"("c47") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r34"."c50" FROM (SELECT DISTINCT "r33"."c48" FROM (SELECT DISTINCT "r32"."id", "r32"."target_value" FROM "qti"."match_table_entry_string" AS "r32") AS "r33"("c48", "c49")) AS "r34"("c50")) AS "r35"("c51") WHERE "r35"."c51" = "r31"."c47")) AS "r36"("c52") UNION SELECT "r45"."c65" FROM (SELECT DISTINCT "r40"."c60" FROM (SELECT DISTINCT "r39"."c59" FROM (SELECT DISTINCT "r38"."c55" FROM (SELECT DISTINCT "r37"."base_type", "r37"."declaration", "r37"."id", "r37"."position", "r37"."source_value", "r37"."table" FROM "qti"."match_table_entry" AS "r37") AS "r38"("c53", "c54", "c55", "c56", "c57", "c58") WHERE "r38"."c53" = 'identifier'::"qti"."base_type") AS "r39"("c59")) AS "r40"("c60") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r43"."c63" FROM (SELECT DISTINCT "r42"."c61" FROM (SELECT DISTINCT "r41"."id", "r41"."target_value" FROM "qti"."match_table_entry_identifier" AS "r41") AS "r42"("c61", "c62")) AS "r43"("c63")) AS "r44"("c64") WHERE "r44"."c64" = "r40"."c60")) AS "r45"("c65") UNION SELECT "r54"."c78" FROM (SELECT DISTINCT "r49"."c73" FROM (SELECT DISTINCT "r48"."c72" FROM (SELECT DISTINCT "r47"."c68" FROM (SELECT DISTINCT "r46"."base_type", "r46"."declaration", "r46"."id", "r46"."position", "r46"."source_value", "r46"."table" FROM "qti"."match_table_entry" AS "r46") AS "r47"("c66", "c67", "c68", "c69", "c70", "c71") WHERE "r47"."c66" = 'uri'::"qti"."base_type") AS "r48"("c72")) AS "r49"("c73") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r52"."c76" FROM (SELECT DISTINCT "r51"."c74" FROM (SELECT DISTINCT "r50"."id", "r50"."target_value" FROM "qti"."match_table_entry_uri" AS "r50") AS "r51"("c74", "c75")) AS "r52"("c76")) AS "r53"("c77") WHERE "r53"."c77" = "r49"."c73")) AS "r54"("c78") UNION SELECT "r63"."c91" FROM (SELECT DISTINCT "r58"."c86" FROM (SELECT DISTINCT "r57"."c85" FROM (SELECT DISTINCT "r56"."c81" FROM (SELECT DISTINCT "r55"."base_type", "r55"."declaration", "r55"."id", "r55"."position", "r55"."source_value", "r55"."table" FROM "qti"."match_table_entry" AS "r55") AS "r56"("c79", "c80", "c81", "c82", "c83", "c84") WHERE "r56"."c79" = 'duration'::"qti"."base_type") AS "r57"("c85")) AS "r58"("c86") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r61"."c89" FROM (SELECT DISTINCT "r60"."c87" FROM (SELECT DISTINCT "r59"."id", "r59"."target_value" FROM "qti"."match_table_entry_duration" AS "r59") AS "r60"("c87", "c88")) AS "r61"("c89")) AS "r62"("c90") WHERE "r62"."c90" = "r58"."c86")) AS "r63"("c91") UNION SELECT "r72"."c104" FROM (SELECT DISTINCT "r67"."c99" FROM (SELECT DISTINCT "r66"."c98" FROM (SELECT DISTINCT "r65"."c94" FROM (SELECT DISTINCT "r64"."base_type", "r64"."declaration", "r64"."id", "r64"."position", "r64"."source_value", "r64"."table" FROM "qti"."match_table_entry" AS "r64") AS "r65"("c92", "c93", "c94", "c95", "c96", "c97") WHERE "r65"."c92" = 'point'::"qti"."base_type") AS "r66"("c98")) AS "r67"("c99") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r70"."c102" FROM (SELECT DISTINCT "r69"."c100" FROM (SELECT DISTINCT "r68"."id", "r68"."target_value" FROM "qti"."match_table_entry_point" AS "r68") AS "r69"("c100", "c101")) AS "r70"("c102")) AS "r71"("c103") WHERE "r71"."c103" = "r67"."c99")) AS "r72"("c104") UNION SELECT "r81"."c117" FROM (SELECT DISTINCT "r76"."c112" FROM (SELECT DISTINCT "r75"."c111" FROM (SELECT DISTINCT "r74"."c107" FROM (SELECT DISTINCT "r73"."base_type", "r73"."declaration", "r73"."id", "r73"."position", "r73"."source_value", "r73"."table" FROM "qti"."match_table_entry" AS "r73") AS "r74"("c105", "c106", "c107", "c108", "c109", "c110") WHERE "r74"."c105" = 'pair'::"qti"."base_type") AS "r75"("c111")) AS "r76"("c112") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r79"."c115" FROM (SELECT DISTINCT "r78"."c113" FROM (SELECT DISTINCT "r77"."id", "r77"."target_value" FROM "qti"."match_table_entry_pair" AS "r77") AS "r78"("c113", "c114")) AS "r79"("c115")) AS "r80"("c116") WHERE "r80"."c116" = "r76"."c112")) AS "r81"("c117") UNION SELECT "r90"."c130" FROM (SELECT DISTINCT "r85"."c125" FROM (SELECT DISTINCT "r84"."c124" FROM (SELECT DISTINCT "r83"."c120" FROM (SELECT DISTINCT "r82"."base_type", "r82"."declaration", "r82"."id", "r82"."position", "r82"."source_value", "r82"."table" FROM "qti"."match_table_entry" AS "r82") AS "r83"("c118", "c119", "c120", "c121", "c122", "c123") WHERE "r83"."c118" = 'directedPair'::"qti"."base_type") AS "r84"("c124")) AS "r85"("c125") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r88"."c128" FROM (SELECT DISTINCT "r87"."c126" FROM (SELECT DISTINCT "r86"."id", "r86"."target_value" FROM "qti"."match_table_entry_directed_pair" AS "r86") AS "r87"("c126", "c127")) AS "r88"("c128")) AS "r89"("c129") WHERE "r89"."c129" = "r85"."c125")) AS "r90"("c130") UNION SELECT "r99"."c143" FROM (SELECT DISTINCT "r94"."c138" FROM (SELECT DISTINCT "r93"."c137" FROM (SELECT DISTINCT "r92"."c133" FROM (SELECT DISTINCT "r91"."base_type", "r91"."declaration", "r91"."id", "r91"."position", "r91"."source_value", "r91"."table" FROM "qti"."match_table_entry" AS "r91") AS "r92"("c131", "c132", "c133", "c134", "c135", "c136") WHERE "r92"."c131" = 'file'::"qti"."base_type") AS "r93"("c137")) AS "r94"("c138") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r97"."c141" FROM (SELECT DISTINCT "r96"."c139" FROM (SELECT DISTINCT "r95"."id", "r95"."target_value" FROM "qti"."match_table_entry_file" AS "r95") AS "r96"("c139", "c140")) AS "r97"("c141")) AS "r98"("c142") WHERE "r98"."c142" = "r94"."c138")) AS "r99"("c143")) AS "r100"("c144")) THEN
    RAISE EXCEPTION 'law __match_table_entry_base_type_alternatives_nyt6h5jjas is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__match_table_entry_base_type_alternatives_nyt6h5jjas'::"pg_catalog"."text";
  END IF;
END
$$;
