-- Validate law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."associable_hotspot", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_5w6l2anx4i"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'associable_hotspot'::text THEN
    IF NEW."shape" = 'poly'::"qti"."shape" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'poly'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["AssociableHotspot",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["AssociableHotspot"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
        IF "t"."c2" = 'poly'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["AssociableHotspot",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["AssociableHotspot"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    ELSE
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
        IF "t"."c2" = 'poly'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["AssociableHotspot",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["AssociableHotspot"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_5w6l2anx4i"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_poly_capacity_coords_j7zoj27d4c"
  AFTER INSERT ON "qti"."associable_hotspot"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_5w6l2anx4i"();

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_poly_capacity_coords_tojlirifv7"
  AFTER INSERT OR DELETE ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_5w6l2anx4i"();

-- The full violation query of law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c63" AS "id" FROM (SELECT "r13"."c32" FROM (SELECT DISTINCT "r12"."c30" FROM (SELECT DISTINCT "r11"."c28", "r11"."c29" FROM (SELECT DISTINCT "r4"."c11", "r10"."c27" FROM (SELECT DISTINCT "r3"."c10" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape", "r1"."show_hide" FROM "qti"."associable_hotspot" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9") WHERE "r2"."c8" = 'poly'::"qti"."shape") AS "r3"("c10")) AS "r4"("c11"), (SELECT DISTINCT "r9"."c24", "r9"."c25" FROM (SELECT "r8"."c20", count(*) FROM (SELECT DISTINCT "r7"."c16", "r7"."c17", "r7"."c18", "r7"."c19" FROM (SELECT DISTINCT "r6"."c12", "r6"."c13", "r6"."c14", "r6"."c15" FROM (SELECT DISTINCT "r5"."node", "r5"."owner_kind", "r5"."shape", "r5"."value" FROM "qti"."coords" AS "r5") AS "r6"("c12", "c13", "c14", "c15")) AS "r7"("c16", "c17", "c18", "c19")) AS "r8"("c20", "c21", "c22", "c23") GROUP BY "r8"."c20") AS "r9"("c24", "c25")) AS "r10"("c26", "c27") WHERE "r4"."c11" = "r10"."c26") AS "r11"("c28", "c29") WHERE "r11"."c29" < 1::bigint OR "r11"."c29" > 1::bigint) AS "r12"("c30", "c31")) AS "r13"("c32") UNION SELECT "r26"."c62" FROM (SELECT DISTINCT "r25"."c61" FROM (SELECT DISTINCT "r24"."c60" FROM (SELECT DISTINCT "r17"."c43" FROM (SELECT DISTINCT "r16"."c42" FROM (SELECT DISTINCT "r15"."c33" FROM (SELECT DISTINCT "r14"."id", "r14"."identifier", "r14"."interaction", "r14"."match_max", "r14"."match_max_n", "r14"."match_min_n", "r14"."parent_kind", "r14"."shape", "r14"."show_hide" FROM "qti"."associable_hotspot" AS "r14") AS "r15"("c33", "c34", "c35", "c36", "c37", "c38", "c39", "c40", "c41") WHERE "r15"."c40" = 'poly'::"qti"."shape") AS "r16"("c42")) AS "r17"("c43") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c56", "r22"."c57" FROM (SELECT "r21"."c52", count(*) FROM (SELECT DISTINCT "r20"."c48", "r20"."c49", "r20"."c50", "r20"."c51" FROM (SELECT DISTINCT "r19"."c44", "r19"."c45", "r19"."c46", "r19"."c47" FROM (SELECT DISTINCT "r18"."node", "r18"."owner_kind", "r18"."shape", "r18"."value" FROM "qti"."coords" AS "r18") AS "r19"("c44", "c45", "c46", "c47")) AS "r20"("c48", "c49", "c50", "c51")) AS "r21"("c52", "c53", "c54", "c55") GROUP BY "r21"."c52") AS "r22"("c56", "c57")) AS "r23"("c58", "c59") WHERE "r23"."c58" = "r17"."c43")) AS "r24"("c60") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c61")) AS "r26"("c62")) AS "r27"("c63")) THEN
    RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::text;
  END IF;
END
$$;
