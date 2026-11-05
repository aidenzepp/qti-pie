-- Validate law __area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."area_map_entry", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_5qnhbbqu76"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'ellipse'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AreaMapEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AreaMapEntry"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_5qnhbbqu76"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_b6lwiq2meb"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
    IF "t"."c2" = 'ellipse'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AreaMapEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AreaMapEntry"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_b6lwiq2meb"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_i26pdha6h6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'ellipse'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AreaMapEntry",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AreaMapEntry"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_i26pdha6h6"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_area_map_entry_shape_ellipse_capacity_coords_wxropox4d6"
  AFTER INSERT ON "qti"."area_map_entry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."shape" = 'ellipse'::"qti"."shape")
  EXECUTE FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_5qnhbbqu76"();

CREATE CONSTRAINT TRIGGER "__law_area_map_entry_shape_ellipse_capacity_coords_vau7b5c23u"
  AFTER DELETE ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_b6lwiq2meb"();

CREATE CONSTRAINT TRIGGER "__law_area_map_entry_shape_ellipse_capacity_coords_d2aaerbtry"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_area_map_entry_shape_ellipse_capacity_coords_i26pdha6h6"();

-- The full violation query of law __area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c38" AS "id" FROM (WITH "r4"("c7") AS MATERIALIZED (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."area_mapping", "r1"."id", "r1"."mapped_value", "r1"."position", "r1"."shape" FROM "qti"."area_map_entry" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = 'ellipse'::"qti"."shape") AS "r3"("c6")), "r12"("c23", "c24") AS MATERIALIZED (SELECT DISTINCT "r11"."c21", "r11"."c22" FROM (SELECT "r10"."c17", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c13", "r9"."c14", "r9"."c15", "r9"."c16" FROM (SELECT DISTINCT "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12" FROM (SELECT DISTINCT "r7"."node", "r7"."owner_kind", "r7"."shape", "r7"."value" FROM "qti"."coords" AS "r7") AS "r8"("c9", "c10", "c11", "c12")) AS "r9"("c13", "c14", "c15", "c16")) AS "r10"("c17", "c18", "c19", "c20") GROUP BY "r10"."c17") AS "r11"("c21", "c22")) SELECT "r17"."c31" FROM (SELECT DISTINCT "r16"."c29" FROM (SELECT DISTINCT "r15"."c27", "r15"."c28" FROM (SELECT DISTINCT "r6"."c8", "r14"."c26" FROM (SELECT "r5"."c7" FROM "r4" AS "r5") AS "r6"("c8"), (SELECT "r13"."c23", "r13"."c24" FROM "r12" AS "r13") AS "r14"("c25", "c26") WHERE "r6"."c8" = "r14"."c25") AS "r15"("c27", "c28") WHERE "r15"."c28" < 1::bigint OR "r15"."c28" > 1::bigint) AS "r16"("c29", "c30")) AS "r17"("c31") UNION SELECT "r24"."c37" FROM (SELECT DISTINCT "r23"."c36" FROM (SELECT DISTINCT "r22"."c35" FROM (SELECT DISTINCT "r19"."c32" FROM (SELECT "r18"."c7" FROM "r4" AS "r18") AS "r19"("c32") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c23", "r20"."c24" FROM "r12" AS "r20") AS "r21"("c33", "c34") WHERE "r21"."c33" = "r19"."c32")) AS "r22"("c35") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c36")) AS "r24"("c37")) AS "r25"("c38")) THEN
    RAISE EXCEPTION 'law __area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__area_map_entry_shape_ellipse_capacity_coords_4bbzhilvda'::"pg_catalog"."text";
  END IF;
END
$$;
