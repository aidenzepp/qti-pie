-- Validate law __area_map_entry_shape_default_capacity_coords_zezbvgfste: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."area_map_entry", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_area_map_entry_shape_default_capacity_coords_mpe5jd2tmx"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'default'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __area_map_entry_shape_default_capacity_coords_zezbvgfste violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__area_map_entry_shape_default_capacity_coords_zezbvgfste'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AreaMapEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AreaMapEntry"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_area_map_entry_shape_default_capacity_coords_mpe5jd2tmx"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_area_map_entry_shape_default_capacity_coords_hzb3cfo4cf"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'default'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __area_map_entry_shape_default_capacity_coords_zezbvgfste violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__area_map_entry_shape_default_capacity_coords_zezbvgfste'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AreaMapEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AreaMapEntry"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_area_map_entry_shape_default_capacity_coords_hzb3cfo4cf"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_area_map_entry_shape_default_capacity_coords_n4yfksoduj"
  AFTER INSERT ON "qti"."area_map_entry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."shape" = 'default'::"qti"."shape")
  EXECUTE FUNCTION "qti"."__law_area_map_entry_shape_default_capacity_coords_mpe5jd2tmx"();

CREATE CONSTRAINT TRIGGER "__law_area_map_entry_shape_default_capacity_coords_yytlw4gm75"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_area_map_entry_shape_default_capacity_coords_hzb3cfo4cf"();

-- The full violation query of law __area_map_entry_shape_default_capacity_coords_zezbvgfste.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c28" AS "id" FROM (SELECT DISTINCT "r12"."c26" FROM (SELECT DISTINCT "r11"."c24", "r11"."c25" FROM (SELECT DISTINCT "r4"."c7", "r10"."c23" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."area_mapping", "r1"."id", "r1"."mapped_value", "r1"."position", "r1"."shape" FROM "qti"."area_map_entry" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = 'default'::"qti"."shape") AS "r3"("c6")) AS "r4"("c7"), (SELECT DISTINCT "r9"."c20", "r9"."c21" FROM (SELECT "r8"."c16", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c12", "r7"."c13", "r7"."c14", "r7"."c15" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11" FROM (SELECT DISTINCT "r5"."node", "r5"."owner_kind", "r5"."shape", "r5"."value" FROM "qti"."coords" AS "r5") AS "r6"("c8", "c9", "c10", "c11")) AS "r7"("c12", "c13", "c14", "c15")) AS "r8"("c16", "c17", "c18", "c19") GROUP BY "r8"."c16") AS "r9"("c20", "c21")) AS "r10"("c22", "c23") WHERE "r4"."c7" = "r10"."c22") AS "r11"("c24", "c25") WHERE "r11"."c25" < 0::bigint OR "r11"."c25" > 1::bigint) AS "r12"("c26", "c27")) AS "r13"("c28")) THEN
    RAISE EXCEPTION 'law __area_map_entry_shape_default_capacity_coords_zezbvgfste is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__area_map_entry_shape_default_capacity_coords_zezbvgfste'::"pg_catalog"."text";
  END IF;
END
$$;
