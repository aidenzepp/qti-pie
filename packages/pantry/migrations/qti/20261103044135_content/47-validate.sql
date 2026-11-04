-- Validate law __coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."area_map_entry", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_coords_owner_kind_qti_area_map_entry_in_area_dvos2or7rp"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "w" record;
BEGIN
  IF TG_TABLE_NAME = 'coords'::text THEN
    IF NEW."owner_kind" = 'qti-area-map-entry'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = NEW."node" AND "r1"."shape" = NEW."shape";
      IF NOT FOUND THEN
        FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = NEW."node" AND "r1"."shape" = NEW."shape" AND "r1"."owner_kind" = 'qti-area-map-entry'::"qti"."node_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
          RAISE EXCEPTION 'law __coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Coords",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["Coords"]'::text END;
        END LOOP;
      END IF;
    END IF;
  ELSE
    PERFORM 1 FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = OLD."id" AND "r1"."shape" = OLD."shape";
    IF NOT FOUND THEN
      FOR "w" IN SELECT "r1"."node" AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = OLD."id" AND "r1"."shape" = OLD."shape" AND "r1"."owner_kind" = 'qti-area-map-entry'::"qti"."node_kind" ORDER BY "r1"."node" LIMIT 1 LOOP
        RAISE EXCEPTION 'law __coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Coords",'::text || to_jsonb("w"."c1"::text)::text || ']'::text ELSE 'w["Coords"]'::text END;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_coords_owner_kind_qti_area_map_entry_in_area_dvos2or7rp"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_coords_owner_kind_qti_area_map_entry_in_area_43aavynnom"
  AFTER DELETE ON "qti"."area_map_entry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_owner_kind_qti_area_map_entry_in_area_dvos2or7rp"();

CREATE CONSTRAINT TRIGGER "__law_coords_owner_kind_qti_area_map_entry_in_area_jp5tui6qpu"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_coords_owner_kind_qti_area_map_entry_in_area_dvos2or7rp"();

-- The full violation query of law __coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c18" AS "node", "r9"."c19" AS "shape" FROM (SELECT DISTINCT "r4"."c7", "r4"."c8" FROM (SELECT DISTINCT "r3"."c5", "r3"."c6" FROM (SELECT DISTINCT "r2"."c1", "r2"."c3" FROM (SELECT DISTINCT "r1"."node", "r1"."owner_kind", "r1"."shape", "r1"."value" FROM "qti"."coords" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c2" = 'qti-area-map-entry'::"qti"."node_kind") AS "r3"("c5", "c6")) AS "r4"("c7", "c8") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c10", "r6"."c13" FROM (SELECT DISTINCT "r5"."area_mapping", "r5"."id", "r5"."mapped_value", "r5"."position", "r5"."shape" FROM "qti"."area_map_entry" AS "r5") AS "r6"("c9", "c10", "c11", "c12", "c13")) AS "r7"("c14", "c15")) AS "r8"("c16", "c17") WHERE "r8"."c16" = "r4"."c7" AND "r8"."c17" = "r4"."c8")) AS "r9"("c18", "c19")) THEN
    RAISE EXCEPTION 'law __coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__coords_owner_kind_qti_area_map_entry_in_area_map_y5eudtdise'::text;
  END IF;
END
$$;
