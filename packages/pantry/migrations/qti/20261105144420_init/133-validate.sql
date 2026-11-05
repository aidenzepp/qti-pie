-- Validate law __document_root_outcomes_in_outcome_document_v6c77tbtsm: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document", "qti"."outcome_document" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_outcomes_in_outcome_document_5ezs64od7r"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'outcomes'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."outcome_document" AS "r1" WHERE "r1"."document" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_root_outcomes_in_outcome_document_v6c77tbtsm violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__document_root_outcomes_in_outcome_document_v6c77tbtsm'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_outcomes_in_outcome_document_5ezs64od7r"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_outcomes_in_outcome_document_d6sfynwavm"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = OLD."document" LOOP
    IF "p"."c2" = 'outcomes'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."outcome_document" AS "r1" WHERE "r1"."document" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __document_root_outcomes_in_outcome_document_v6c77tbtsm violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__document_root_outcomes_in_outcome_document_v6c77tbtsm'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_outcomes_in_outcome_document_d6sfynwavm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_root_outcomes_in_outcome_document_2rff7fulig"
  AFTER INSERT ON "qti"."document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'outcomes'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_document_root_outcomes_in_outcome_document_5ezs64od7r"();

CREATE CONSTRAINT TRIGGER "__law_document_root_outcomes_in_outcome_document_xpk3up2omh"
  AFTER DELETE ON "qti"."outcome_document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_root_outcomes_in_outcome_document_d6sfynwavm"();

-- The full violation query of law __document_root_outcomes_in_outcome_document_v6c77tbtsm.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c15" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version" FROM "qti"."document" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'outcomes'::"qti"."root_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13" FROM (SELECT DISTINCT "r6"."c11" FROM (SELECT DISTINCT "r5"."declaration", "r5"."document", "r5"."identifier" FROM "qti"."outcome_document" AS "r5") AS "r6"("c10", "c11", "c12")) AS "r7"("c13")) AS "r8"("c14") WHERE "r8"."c14" = "r4"."c9")) AS "r9"("c15")) THEN
    RAISE EXCEPTION 'law __document_root_outcomes_in_outcome_document_v6c77tbtsm is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__document_root_outcomes_in_outcome_document_v6c77tbtsm'::"pg_catalog"."text";
  END IF;
END
$$;
