-- Validate law __branch_rule_target_kind_alternatives_nk2br5lf3j: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."branch_rule", "qti"."branch_rule_exit", "qti"."branch_rule_target" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_w5btnavp2f"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."target_kind" AS "c2" FROM "qti"."branch_rule" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'exit'::"qti"."branch_target" THEN
        PERFORM 1 FROM "qti"."branch_rule_exit" AS "r1" WHERE "r1"."rule" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __branch_rule_target_kind_alternatives_nk2br5lf3j violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__branch_rule_target_kind_alternatives_nk2br5lf3j'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["BranchRule",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["BranchRule"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'ref'::"qti"."branch_target" THEN
        PERFORM 1 FROM "qti"."branch_rule_target" AS "r1" WHERE "r1"."rule" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __branch_rule_target_kind_alternatives_nk2br5lf3j violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__branch_rule_target_kind_alternatives_nk2br5lf3j'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["BranchRule",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["BranchRule"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_w5btnavp2f"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_zrlelgzkal"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."target_kind" AS "c2" FROM "qti"."branch_rule" AS "r1" WHERE "r1"."id" = OLD."rule" LOOP
    IF "p"."c2" = 'exit'::"qti"."branch_target" THEN
      PERFORM 1 FROM "qti"."branch_rule_exit" AS "r1" WHERE "r1"."rule" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __branch_rule_target_kind_alternatives_nk2br5lf3j violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__branch_rule_target_kind_alternatives_nk2br5lf3j'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["BranchRule",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["BranchRule"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_zrlelgzkal"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_ek3u5y7odt"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."target_kind" AS "c2" FROM "qti"."branch_rule" AS "r1" WHERE "r1"."id" = OLD."rule" LOOP
    IF "p"."c2" = 'ref'::"qti"."branch_target" THEN
      PERFORM 1 FROM "qti"."branch_rule_target" AS "r1" WHERE "r1"."rule" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __branch_rule_target_kind_alternatives_nk2br5lf3j violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__branch_rule_target_kind_alternatives_nk2br5lf3j'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["BranchRule",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["BranchRule"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_ek3u5y7odt"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_branch_rule_target_kind_alternatives_uglhwxg2o7"
  AFTER INSERT ON "qti"."branch_rule"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_w5btnavp2f"();

CREATE CONSTRAINT TRIGGER "__law_branch_rule_target_kind_alternatives_rnbsq2uong"
  AFTER DELETE ON "qti"."branch_rule_exit"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_zrlelgzkal"();

CREATE CONSTRAINT TRIGGER "__law_branch_rule_target_kind_alternatives_yvuprqiwsj"
  AFTER DELETE ON "qti"."branch_rule_target"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_branch_rule_target_kind_alternatives_ek3u5y7odt"();

-- The full violation query of law __branch_rule_target_kind_alternatives_nk2br5lf3j.
DO $$
BEGIN
  IF EXISTS (SELECT "r19"."c28" AS "id" FROM (SELECT "r9"."c12" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."document", "r1"."id", "r1"."owner", "r1"."owner_kind", "r1"."target_kind" FROM "qti"."branch_rule" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = 'exit'::"qti"."branch_target") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c10" FROM (SELECT DISTINCT "r6"."c9" FROM (SELECT DISTINCT "r5"."exit", "r5"."rule" FROM "qti"."branch_rule_exit" AS "r5") AS "r6"("c8", "c9")) AS "r7"("c10")) AS "r8"("c11") WHERE "r8"."c11" = "r4"."c7")) AS "r9"("c12") UNION SELECT "r18"."c27" FROM (SELECT DISTINCT "r13"."c19" FROM (SELECT DISTINCT "r12"."c18" FROM (SELECT DISTINCT "r11"."c14" FROM (SELECT DISTINCT "r10"."document", "r10"."id", "r10"."owner", "r10"."owner_kind", "r10"."target_kind" FROM "qti"."branch_rule" AS "r10") AS "r11"("c13", "c14", "c15", "c16", "c17") WHERE "r11"."c17" = 'ref'::"qti"."branch_target") AS "r12"("c18")) AS "r13"("c19") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c25" FROM (SELECT DISTINCT "r15"."c23" FROM (SELECT DISTINCT "r14"."holder_kind", "r14"."identifier", "r14"."owner_kind", "r14"."rule", "r14"."scope" FROM "qti"."branch_rule_target" AS "r14") AS "r15"("c20", "c21", "c22", "c23", "c24")) AS "r16"("c25")) AS "r17"("c26") WHERE "r17"."c26" = "r13"."c19")) AS "r18"("c27")) AS "r19"("c28")) THEN
    RAISE EXCEPTION 'law __branch_rule_target_kind_alternatives_nk2br5lf3j is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__branch_rule_target_kind_alternatives_nk2br5lf3j'::"pg_catalog"."text";
  END IF;
END
$$;
