-- Validate law __tree_kind_manifest_in_package_i47ndm2dke: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."package", "qti"."tree" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_tree_kind_manifest_in_package_xcc7sckf4p"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."package" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."schemaversion" = OLD."schemaversion";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."tree" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."version" = OLD."schemaversion" AND "r1"."kind" = 'manifest'::"qti"."tree_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __tree_kind_manifest_in_package_i47ndm2dke violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__tree_kind_manifest_in_package_i47ndm2dke'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Tree",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Tree"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_tree_kind_manifest_in_package_xcc7sckf4p"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_tree_kind_manifest_in_package_2k325hfv5q"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."package" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."schemaversion" = NEW."version";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."id" AS "c1" FROM "qti"."tree" AS "r1" WHERE "r1"."id" = NEW."id" AND "r1"."version" = NEW."version" AND "r1"."kind" = 'manifest'::"qti"."tree_kind" ORDER BY "r1"."id" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __tree_kind_manifest_in_package_i47ndm2dke violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__tree_kind_manifest_in_package_i47ndm2dke'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Tree",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Tree"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_tree_kind_manifest_in_package_2k325hfv5q"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_tree_kind_manifest_in_package_i6m3k4uakg"
  AFTER DELETE ON "qti"."package"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_tree_kind_manifest_in_package_xcc7sckf4p"();

CREATE CONSTRAINT TRIGGER "__law_tree_kind_manifest_in_package_zid3jct4au"
  AFTER INSERT ON "qti"."tree"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'manifest'::"qti"."tree_kind")
  EXECUTE FUNCTION "qti"."__law_tree_kind_manifest_in_package_2k325hfv5q"();

-- The full violation query of law __tree_kind_manifest_in_package_i47ndm2dke.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c17" AS "id", "r9"."c18" AS "version" FROM (SELECT DISTINCT "r4"."c8", "r4"."c9" FROM (SELECT DISTINCT "r3"."c6", "r3"."c7" FROM (SELECT DISTINCT "r2"."c2", "r2"."c5" FROM (SELECT DISTINCT "r1"."charset", "r1"."id", "r1"."kind", "r1"."root", "r1"."version" FROM "qti"."tree" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c3" = 'manifest'::"qti"."tree_kind") AS "r3"("c6", "c7")) AS "r4"("c8", "c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c13", "r7"."c14" FROM (SELECT DISTINCT "r6"."c10", "r6"."c12" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."schemaversion" FROM "qti"."package" AS "r5") AS "r6"("c10", "c11", "c12")) AS "r7"("c13", "c14")) AS "r8"("c15", "c16") WHERE "r8"."c15" = "r4"."c8" AND "r8"."c16" = "r4"."c9")) AS "r9"("c17", "c18")) THEN
    RAISE EXCEPTION 'law __tree_kind_manifest_in_package_i47ndm2dke is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__tree_kind_manifest_in_package_i47ndm2dke'::"pg_catalog"."text";
  END IF;
END
$$;
