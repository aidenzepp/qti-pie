-- Validate law __response_processing_root_kind_item_in_response_dfgtfkwxas: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."response_processing", "qti"."response_processing_item" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_response_processing_root_kind_item_in_response_nlv6keezly"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root_kind" AS "c2" FROM "qti"."response_processing" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'item'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."response_processing_item" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __response_processing_root_kind_item_in_response_dfgtfkwxas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__response_processing_root_kind_item_in_response_dfgtfkwxas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResponseProcessing",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResponseProcessing"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_response_processing_root_kind_item_in_response_nlv6keezly"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_response_processing_root_kind_item_in_response_5qzx6ubdvs"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."root_kind" AS "c2" FROM "qti"."response_processing" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'item'::"qti"."root_kind" THEN
      PERFORM 1 FROM "qti"."response_processing_item" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __response_processing_root_kind_item_in_response_dfgtfkwxas violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__response_processing_root_kind_item_in_response_dfgtfkwxas'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ResponseProcessing",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ResponseProcessing"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_response_processing_root_kind_item_in_response_5qzx6ubdvs"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_response_processing_root_kind_item_in_response_oyyhdcdbjc"
  AFTER INSERT ON "qti"."response_processing"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root_kind" = 'item'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_response_processing_root_kind_item_in_response_nlv6keezly"();

CREATE CONSTRAINT TRIGGER "__law_response_processing_root_kind_item_in_response_3vajm5ls3a"
  AFTER DELETE ON "qti"."response_processing_item"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_response_processing_root_kind_item_in_response_5qzx6ubdvs"();

-- The full violation query of law __response_processing_root_kind_item_in_response_dfgtfkwxas.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c9" AS "id" FROM (SELECT DISTINCT "r4"."c4" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."root_kind" FROM "qti"."response_processing" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c2" = 'item'::"qti"."root_kind") AS "r3"("c3")) AS "r4"("c4") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c7" FROM (SELECT DISTINCT "r6"."c5" FROM (SELECT DISTINCT "r5"."id", "r5"."item" FROM "qti"."response_processing_item" AS "r5") AS "r6"("c5", "c6")) AS "r7"("c7")) AS "r8"("c8") WHERE "r8"."c8" = "r4"."c4")) AS "r9"("c9")) THEN
    RAISE EXCEPTION 'law __response_processing_root_kind_item_in_response_dfgtfkwxas is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__response_processing_root_kind_item_in_response_dfgtfkwxas'::"pg_catalog"."text";
  END IF;
END
$$;
