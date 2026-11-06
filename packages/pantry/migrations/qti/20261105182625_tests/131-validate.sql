-- Validate law __selection_with_replacement_false_in_selection_j56mzt7o7m: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."selection", "qti"."selection_bounded" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_5mai563ruj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."selection_bounded" AS "r1" WHERE "r1"."section" = NEW."section";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."section" AS "c1" FROM "qti"."selection" AS "r1" WHERE "r1"."section" = NEW."section" AND "r1"."with_replacement" = 'false'::"qti"."xs_boolean" ORDER BY "r1"."section" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __selection_with_replacement_false_in_selection_j56mzt7o7m violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__selection_with_replacement_false_in_selection_j56mzt7o7m'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Selection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Selection"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_5mai563ruj"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_oxzf6h6avu"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."selection_bounded" AS "r1" WHERE "r1"."section" = OLD."section";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."section" AS "c1" FROM "qti"."selection" AS "r1" WHERE "r1"."section" = OLD."section" AND "r1"."with_replacement" = 'false'::"qti"."xs_boolean" ORDER BY "r1"."section" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __selection_with_replacement_false_in_selection_j56mzt7o7m violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__selection_with_replacement_false_in_selection_j56mzt7o7m'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Selection",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Selection"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_oxzf6h6avu"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_selection_with_replacement_false_in_selection_tvqqstvzyb"
  AFTER INSERT ON "qti"."selection"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."with_replacement" = 'false'::"qti"."xs_boolean")
  EXECUTE FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_5mai563ruj"();

CREATE CONSTRAINT TRIGGER "__law_selection_with_replacement_false_in_selection_gsyfbommwy"
  AFTER DELETE ON "qti"."selection_bounded"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_selection_with_replacement_false_in_selection_oxzf6h6avu"();

-- The full violation query of law __selection_with_replacement_false_in_selection_j56mzt7o7m.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c12" AS "section" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."id", "r1"."section", "r1"."select", "r1"."with_replacement" FROM "qti"."selection" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c4" = 'false'::"qti"."xs_boolean") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."section", "r5"."select", "r5"."with_replacement" FROM "qti"."selection_bounded" AS "r5") AS "r6"("c7", "c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c6")) AS "r9"("c12")) THEN
    RAISE EXCEPTION 'law __selection_with_replacement_false_in_selection_j56mzt7o7m is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__selection_with_replacement_false_in_selection_j56mzt7o7m'::"pg_catalog"."text";
  END IF;
END
$$;
