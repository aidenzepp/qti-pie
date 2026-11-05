-- Validate law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_identifier", "qti"."resource_lom_identified" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_rk3sidb4in"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = NEW."lom";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = NEW."lom" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["LomIdentifier",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["LomIdentifier"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_rk3sidb4in"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_gayowteovj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = OLD."lom";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = OLD."lom" AND "r1"."owner" = 'resource'::"qti"."lom_owner" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["LomIdentifier",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["LomIdentifier"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_gayowteovj"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_lom_identifier_owner_resource_in_resource_lom_3lxuyelunw"
  AFTER INSERT ON "qti"."lom_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."owner" = 'resource'::"qti"."lom_owner")
  EXECUTE FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_rk3sidb4in"();

CREATE CONSTRAINT TRIGGER "__law_lom_identifier_owner_resource_in_resource_lom_pcl55uea7s"
  AFTER DELETE ON "qti"."resource_lom_identified"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_lom_identifier_owner_resource_in_resource_lom_gayowteovj"();

-- The full violation query of law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "lom" FROM (SELECT DISTINCT "r4"."c7" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."id", "r1"."lom", "r1"."owner", "r1"."parent", "r1"."position" FROM "qti"."lom_identifier" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c3" = 'resource'::"qti"."lom_owner") AS "r3"("c6")) AS "r4"("c7") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c8" FROM (SELECT DISTINCT "r5"."lom", "r5"."package", "r5"."resource", "r5"."type" FROM "qti"."resource_lom_identified" AS "r5") AS "r6"("c8", "c9", "c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c7")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__lom_identifier_owner_resource_in_resource_lom_uyfoi3bqzs'::"pg_catalog"."text";
  END IF;
END
$$;
