-- Validate law __associable_hotspot_shape_default_capacity_coords_brvo2ft5mm: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."associable_hotspot", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_default_capacity_mgfxswjgee"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'associable_hotspot'::text THEN
    IF NEW."shape" = 'default'::"qti"."shape" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'default'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __associable_hotspot_shape_default_capacity_coords_brvo2ft5mm violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__associable_hotspot_shape_default_capacity_coords_brvo2ft5mm'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["AssociableHotspot",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["AssociableHotspot"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
      IF "t"."c2" = 'default'::"qti"."shape" THEN
        FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
          IF "g"."c1" > 1::bigint THEN
            RAISE EXCEPTION 'law __associable_hotspot_shape_default_capacity_coords_brvo2ft5mm violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__associable_hotspot_shape_default_capacity_coords_brvo2ft5mm'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["AssociableHotspot",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["AssociableHotspot"]'::text END;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_default_capacity_mgfxswjgee"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_default_capacity_ng5562jisi"
  AFTER INSERT ON "qti"."associable_hotspot"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_default_capacity_mgfxswjgee"();

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_default_capacity_pmmblwqrqj"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_default_capacity_mgfxswjgee"();

-- The full violation query of law __associable_hotspot_shape_default_capacity_coords_brvo2ft5mm.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c31" AS "id" FROM (SELECT DISTINCT "r12"."c29" FROM (SELECT DISTINCT "r11"."c27", "r11"."c28" FROM (SELECT DISTINCT "r4"."c10", "r10"."c26" FROM (SELECT DISTINCT "r3"."c9" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape" FROM "qti"."associable_hotspot" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8") WHERE "r2"."c8" = 'default'::"qti"."shape") AS "r3"("c9")) AS "r4"("c10"), (SELECT DISTINCT "r9"."c23", "r9"."c24" FROM (SELECT "r8"."c19", count(*) FROM (SELECT DISTINCT "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."node", "r5"."owner_kind", "r5"."shape", "r5"."value" FROM "qti"."coords" AS "r5") AS "r6"("c11", "c12", "c13", "c14")) AS "r7"("c15", "c16", "c17", "c18")) AS "r8"("c19", "c20", "c21", "c22") GROUP BY "r8"."c19") AS "r9"("c23", "c24")) AS "r10"("c25", "c26") WHERE "r4"."c10" = "r10"."c25") AS "r11"("c27", "c28") WHERE "r11"."c28" < 0::bigint OR "r11"."c28" > 1::bigint) AS "r12"("c29", "c30")) AS "r13"("c31")) THEN
    RAISE EXCEPTION 'law __associable_hotspot_shape_default_capacity_coords_brvo2ft5mm is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__associable_hotspot_shape_default_capacity_coords_brvo2ft5mm'::text;
  END IF;
END
$$;
