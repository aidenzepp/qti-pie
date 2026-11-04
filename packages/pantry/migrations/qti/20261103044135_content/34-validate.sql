-- Validate law __hotspot_choice_shape_rect_capacity_coords_nvzoun5urf: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."coords", "qti"."hotspot_choice" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_hotspot_choice_shape_rect_capacity_coords_mh6rz3mn64"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'hotspot_choice'::text THEN
    IF NEW."shape" = 'rect'::"qti"."shape" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'rect'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __hotspot_choice_shape_rect_capacity_coords_nvzoun5urf violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__hotspot_choice_shape_rect_capacity_coords_nvzoun5urf'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["HotspotChoice",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["HotspotChoice"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
        IF "t"."c2" = 'rect'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __hotspot_choice_shape_rect_capacity_coords_nvzoun5urf violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__hotspot_choice_shape_rect_capacity_coords_nvzoun5urf'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["HotspotChoice",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["HotspotChoice"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    ELSE
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."hotspot_choice" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
        IF "t"."c2" = 'rect'::"qti"."shape" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __hotspot_choice_shape_rect_capacity_coords_nvzoun5urf violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__hotspot_choice_shape_rect_capacity_coords_nvzoun5urf'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["HotspotChoice",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["HotspotChoice"]'::text END;
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_hotspot_choice_shape_rect_capacity_coords_mh6rz3mn64"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_hotspot_choice_shape_rect_capacity_coords_azi6rt65lm"
  AFTER INSERT OR DELETE ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_hotspot_choice_shape_rect_capacity_coords_mh6rz3mn64"();

CREATE CONSTRAINT TRIGGER "__law_hotspot_choice_shape_rect_capacity_coords_uqe34wmfqn"
  AFTER INSERT ON "qti"."hotspot_choice"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_hotspot_choice_shape_rect_capacity_coords_mh6rz3mn64"();

-- The full violation query of law __hotspot_choice_shape_rect_capacity_coords_nvzoun5urf.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c55" AS "id" FROM (SELECT "r13"."c28" FROM (SELECT DISTINCT "r12"."c26" FROM (SELECT DISTINCT "r11"."c24", "r11"."c25" FROM (SELECT DISTINCT "r4"."c7", "r10"."c23" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."shape", "r1"."show_hide" FROM "qti"."hotspot_choice" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c4" = 'rect'::"qti"."shape") AS "r3"("c6")) AS "r4"("c7"), (SELECT DISTINCT "r9"."c20", "r9"."c21" FROM (SELECT "r8"."c16", count(*) FROM (SELECT DISTINCT "r7"."c12", "r7"."c13", "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."node", "r5"."owner_kind", "r5"."shape", "r5"."value" FROM "qti"."coords" AS "r5") AS "r6"("c8", "c9", "c10", "c11")) AS "r7"("c12", "c13", "c14", "c15")) AS "r8"("c16", "c17", "c18", "c19") GROUP BY "r8"."c16") AS "r9"("c20", "c21")) AS "r10"("c22", "c23") WHERE "r4"."c7" = "r10"."c22") AS "r11"("c24", "c25") WHERE "r11"."c25" < 1::bigint OR "r11"."c25" > 1::bigint) AS "r12"("c26", "c27")) AS "r13"("c28") UNION SELECT "r26"."c54" FROM (SELECT DISTINCT "r25"."c53" FROM (SELECT DISTINCT "r24"."c52" FROM (SELECT DISTINCT "r17"."c35" FROM (SELECT DISTINCT "r16"."c34" FROM (SELECT DISTINCT "r15"."c29" FROM (SELECT DISTINCT "r14"."id", "r14"."identifier", "r14"."interaction", "r14"."shape", "r14"."show_hide" FROM "qti"."hotspot_choice" AS "r14") AS "r15"("c29", "c30", "c31", "c32", "c33") WHERE "r15"."c32" = 'rect'::"qti"."shape") AS "r16"("c34")) AS "r17"("c35") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c48", "r22"."c49" FROM (SELECT "r21"."c44", count(*) FROM (SELECT DISTINCT "r20"."c40", "r20"."c41", "r20"."c42", "r20"."c43" FROM (SELECT DISTINCT "r19"."c36", "r19"."c37", "r19"."c38", "r19"."c39" FROM (SELECT DISTINCT "r18"."node", "r18"."owner_kind", "r18"."shape", "r18"."value" FROM "qti"."coords" AS "r18") AS "r19"("c36", "c37", "c38", "c39")) AS "r20"("c40", "c41", "c42", "c43")) AS "r21"("c44", "c45", "c46", "c47") GROUP BY "r21"."c44") AS "r22"("c48", "c49")) AS "r23"("c50", "c51") WHERE "r23"."c50" = "r17"."c35")) AS "r24"("c52") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c53")) AS "r26"("c54")) AS "r27"("c55")) THEN
    RAISE EXCEPTION 'law __hotspot_choice_shape_rect_capacity_coords_nvzoun5urf is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__hotspot_choice_shape_rect_capacity_coords_nvzoun5urf'::text;
  END IF;
END
$$;
