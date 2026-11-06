-- Validate law __branch_rule_owner_kind_part_in_test_part_ujhcm53e23: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."branch_rule", "qti"."test_part" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_7k2cssptls"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."test_part" AS "r1" WHERE "r1"."id" = NEW."owner";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."branch_rule" AS "r1" WHERE "r1"."owner" = NEW."owner" AND "r1"."owner_kind" = 'part'::"qti"."structure_holder" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __branch_rule_owner_kind_part_in_test_part_ujhcm53e23 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__branch_rule_owner_kind_part_in_test_part_ujhcm53e23'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["BranchRule",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["BranchRule"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_7k2cssptls"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_xrk4rstawu"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."test_part" AS "r1" WHERE "r1"."id" = OLD."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."branch_rule" AS "r1" WHERE "r1"."owner" = OLD."id" AND "r1"."owner_kind" = 'part'::"qti"."structure_holder" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __branch_rule_owner_kind_part_in_test_part_ujhcm53e23 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__branch_rule_owner_kind_part_in_test_part_ujhcm53e23'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["BranchRule",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["BranchRule"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_xrk4rstawu"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_branch_rule_owner_kind_part_in_test_part_smlo4k3r6m"
  AFTER INSERT ON "qti"."branch_rule"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."owner_kind" = 'part'::"qti"."structure_holder")
  EXECUTE FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_7k2cssptls"();

CREATE CONSTRAINT TRIGGER "__law_branch_rule_owner_kind_part_in_test_part_qtvv73qqba"
  AFTER DELETE ON "qti"."test_part"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_branch_rule_owner_kind_part_in_test_part_xrk4rstawu"();

-- The full violation query of law __branch_rule_owner_kind_part_in_test_part_ujhcm53e23.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c15" AS "owner" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."owner", "r1"."owner_kind", "r1"."target_kind" FROM "qti"."branch_rule" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'part'::"qti"."structure_holder") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."document", "r5"."id", "r5"."identifier", "r5"."navigation_mode", "r5"."submission_mode" FROM "qti"."test_part" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12")) AS "r7"("c13")) AS "r8"("c14") WHERE "r8"."c14" = "r4"."c7")) AS "r9"("c15")) THEN
    RAISE EXCEPTION 'law __branch_rule_owner_kind_part_in_test_part_ujhcm53e23 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__branch_rule_owner_kind_part_in_test_part_ujhcm53e23'::"pg_catalog"."text";
  END IF;
END
$$;
