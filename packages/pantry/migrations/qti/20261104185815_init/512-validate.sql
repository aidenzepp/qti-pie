-- Validate law __source_parent_kind_picture_in_source_srcset_b6hhkrpsom: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."source", "qti"."source_srcset" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_source_parent_kind_picture_in_source_srcset_granqfrait"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."source_srcset" AS "r1" WHERE "r1"."node" = NEW."id";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."source" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."parent_kind" = 'picture'::"qti"."node_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __source_parent_kind_picture_in_source_srcset_b6hhkrpsom violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__source_parent_kind_picture_in_source_srcset_b6hhkrpsom'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Source",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Source"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_source_parent_kind_picture_in_source_srcset_granqfrait"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_source_parent_kind_picture_in_source_srcset_ytfgncesmn"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."source_srcset" AS "r1" WHERE "r1"."node" = OLD."node";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."source" AS "r1" WHERE "r1"."id" = OLD."node" AND "r1"."parent_kind" = 'picture'::"qti"."node_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __source_parent_kind_picture_in_source_srcset_b6hhkrpsom violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__source_parent_kind_picture_in_source_srcset_b6hhkrpsom'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Source",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Source"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_source_parent_kind_picture_in_source_srcset_ytfgncesmn"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_source_parent_kind_picture_in_source_srcset_m2tj2qxdci"
  AFTER INSERT ON "qti"."source"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."parent_kind" = 'picture'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_source_parent_kind_picture_in_source_srcset_granqfrait"();

CREATE CONSTRAINT TRIGGER "__law_source_parent_kind_picture_in_source_srcset_rs5kt34v5f"
  AFTER DELETE ON "qti"."source_srcset"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_source_parent_kind_picture_in_source_srcset_ytfgncesmn"();

-- The full violation query of law __source_parent_kind_picture_in_source_srcset_b6hhkrpsom.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c10" AS "id" FROM (SELECT DISTINCT "r4"."c5" FROM (SELECT DISTINCT "r3"."c4" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."parent_kind", "r1"."src" FROM "qti"."source" AS "r1") AS "r2"("c1", "c2", "c3") WHERE "r2"."c2" = 'picture'::"qti"."node_kind") AS "r3"("c4")) AS "r4"("c5") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c8" FROM (SELECT DISTINCT "r6"."c6" FROM (SELECT DISTINCT "r5"."node", "r5"."value" FROM "qti"."source_srcset" AS "r5") AS "r6"("c6", "c7")) AS "r7"("c8")) AS "r8"("c9") WHERE "r8"."c9" = "r4"."c5")) AS "r9"("c10")) THEN
    RAISE EXCEPTION 'law __source_parent_kind_picture_in_source_srcset_b6hhkrpsom is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__source_parent_kind_picture_in_source_srcset_b6hhkrpsom'::"pg_catalog"."text";
  END IF;
END
$$;
