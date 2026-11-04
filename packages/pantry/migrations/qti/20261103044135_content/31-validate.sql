-- Validate law __hotspot_choice_shape_default_capacity_coords_hl5hzbewv4: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."coords", "qti"."hotspot_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_hotspot_choice_shape_default_capacity_coords_gfnhemftic"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'hotspot_choice'::text THEN
    IF NEW."shape" = 'default'::"qti"."shape" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'default'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __hotspot_choice_shape_default_capacity_coords_hl5hzbewv4 violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__hotspot_choice_shape_default_capacity_coords_hl5hzbewv4'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["HotspotChoice",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["HotspotChoice"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
      IF "t"."c2" = 'default'::"qti"."shape" THEN
        FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
          IF "g"."c1" > 1::bigint THEN
            RAISE EXCEPTION 'law __hotspot_choice_shape_default_capacity_coords_hl5hzbewv4 violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__hotspot_choice_shape_default_capacity_coords_hl5hzbewv4'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["HotspotChoice",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["HotspotChoice"]'::text END;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_hotspot_choice_shape_default_capacity_coords_gfnhemftic"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_hotspot_choice_shape_default_capacity_coords_ukg3qnnx2g"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_hotspot_choice_shape_default_capacity_coords_gfnhemftic"();

CREATE CONSTRAINT TRIGGER "__law_hotspot_choice_shape_default_capacity_coords_2jqu2ol4ww"
  AFTER INSERT ON "qti"."hotspot_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_hotspot_choice_shape_default_capacity_coords_gfnhemftic"();

-- The full violation query of law __hotspot_choice_shape_default_capacity_coords_hl5hzbewv4.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c28" AS "id" FROM (SELECT DISTINCT "r12"."c26" FROM (SELECT DISTINCT "r11"."c24", "r11"."c25" FROM (SELECT DISTINCT "r4"."c7", "r10"."c23" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."shape", "r1"."show_hide" FROM "qti"."hotspot_choice" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'default'::"qti"."shape") AS "r3"("c6")) AS "r4"("c7"), (SELECT DISTINCT "r9"."c20", "r9"."c21" FROM (SELECT "r8"."c16", count(*) FROM (SELECT DISTINCT "r7"."c12", "r7"."c13", "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."node", "r5"."owner_kind", "r5"."shape", "r5"."value" FROM "qti"."coords" AS "r5") AS "r6"("c8", "c9", "c10", "c11")) AS "r7"("c12", "c13", "c14", "c15")) AS "r8"("c16", "c17", "c18", "c19") GROUP BY "r8"."c16") AS "r9"("c20", "c21")) AS "r10"("c22", "c23") WHERE "r4"."c7" = "r10"."c22") AS "r11"("c24", "c25") WHERE "r11"."c25" < 0::bigint OR "r11"."c25" > 1::bigint) AS "r12"("c26", "c27")) AS "r13"("c28")) THEN
    RAISE EXCEPTION 'law __hotspot_choice_shape_default_capacity_coords_hl5hzbewv4 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__hotspot_choice_shape_default_capacity_coords_hl5hzbewv4'::text;
  END IF;
END
$$;
