-- Validate law __coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."associable_hotspot", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_owner_kind_qti_associable_hotspot_in_3427u43jfa"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."shape" = OLD."shape";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = OLD."id" AND "r1"."shape" = OLD."shape" AND "r1"."owner_kind" = 'qti-associable-hotspot'::"qti"."node_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_owner_kind_qti_associable_hotspot_in_3427u43jfa"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_owner_kind_qti_associable_hotspot_in_tvt6cblilz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" "pg_catalog"."record";
BEGIN
  PERFORM 1 FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."node" AND "r1"."shape" = NEW."shape";
  IF NOT FOUND THEN
    FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = NEW."node" AND "r1"."shape" = NEW."shape" AND "r1"."owner_kind" = 'qti-associable-hotspot'::"qti"."node_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
      RAISE EXCEPTION 'law __coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Coords",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("w"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Coords"]'::"pg_catalog"."text" END;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_owner_kind_qti_associable_hotspot_in_tvt6cblilz"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_coords_owner_kind_qti_associable_hotspot_in_gmkenptijp"
  AFTER DELETE ON "qti"."associable_hotspot"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_owner_kind_qti_associable_hotspot_in_3427u43jfa"();

CREATE CONSTRAINT TRIGGER "__law_coords_owner_kind_qti_associable_hotspot_in_5cz5447tgu"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."owner_kind" = 'qti-associable-hotspot'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_coords_owner_kind_qti_associable_hotspot_in_tvt6cblilz"();

-- The full violation query of law __coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c21" AS "node", "r9"."c22" AS "shape" FROM (SELECT DISTINCT "r4"."c7", "r4"."c8" FROM (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."node", "r1"."owner_kind", "r1"."shape", "r1"."value" FROM "qti"."coords" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c2" = 'qti-associable-hotspot'::"qti"."node_kind") AS "r3"("c5", "c6")) AS "r4"("c7", "c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c9", "r6"."c15" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."match_max_n", "r5"."match_min_n", "r5"."parent_kind", "r5"."shape", "r5"."show_hide" FROM "qti"."associable_hotspot" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13", "c14", "c15", "c16")) AS "r7"("c17", "c18")) AS "r8"("c19", "c20") WHERE "r8"."c19" = "r4"."c7" AND "r8"."c20" = "r4"."c8")) AS "r9"("c21", "c22")) THEN
    RAISE EXCEPTION 'law __coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__coords_owner_kind_qti_associable_hotspot_in_pou3u3thfn'::"pg_catalog"."text";
  END IF;
END
$$;
