-- Validate law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."associable_hotspot", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_njshsxqgrq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'poly'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssociableHotspot",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssociableHotspot"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_njshsxqgrq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_27flda4d54"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
    IF "t"."c2" = 'poly'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssociableHotspot",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssociableHotspot"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_27flda4d54"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_x6ckomdavc"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'poly'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssociableHotspot",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssociableHotspot"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_x6ckomdavc"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_poly_capacity_coords_a2rtp7t622"
  AFTER INSERT ON "qti"."associable_hotspot"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."shape" = 'poly'::"qti"."shape")
  EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_njshsxqgrq"();

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_poly_capacity_coords_hvwis4k62d"
  AFTER DELETE ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_27flda4d54"();

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_poly_capacity_coords_lzutjvqksv"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_poly_capacity_coords_x6ckomdavc"();

-- The full violation query of law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c61" AS "id" FROM (SELECT "r13"."c31" FROM (SELECT DISTINCT "r12"."c29" FROM (SELECT DISTINCT "r11"."c27", "r11"."c28" FROM (SELECT DISTINCT "r4"."c10", "r10"."c26" FROM (SELECT DISTINCT "r3"."c9" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape", "r1"."show_hide" FROM "qti"."associable_hotspot" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8") WHERE "r2"."c7" = 'poly'::"qti"."shape") AS "r3"("c9")) AS "r4"("c10"), (SELECT DISTINCT "r9"."c23", "r9"."c24" FROM (SELECT "r8"."c19", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18" FROM (SELECT DISTINCT "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."node", "r5"."owner_kind", "r5"."shape", "r5"."value" FROM "qti"."coords" AS "r5") AS "r6"("c11", "c12", "c13", "c14")) AS "r7"("c15", "c16", "c17", "c18")) AS "r8"("c19", "c20", "c21", "c22") GROUP BY "r8"."c19") AS "r9"("c23", "c24")) AS "r10"("c25", "c26") WHERE "r4"."c10" = "r10"."c25") AS "r11"("c27", "c28") WHERE "r11"."c28" < 1::bigint OR "r11"."c28" > 1::bigint) AS "r12"("c29", "c30")) AS "r13"("c31") UNION SELECT "r26"."c60" FROM (SELECT DISTINCT "r25"."c59" FROM (SELECT DISTINCT "r24"."c58" FROM (SELECT DISTINCT "r17"."c41" FROM (SELECT DISTINCT "r16"."c40" FROM (SELECT DISTINCT "r15"."c32" FROM (SELECT DISTINCT "r14"."id", "r14"."identifier", "r14"."interaction", "r14"."match_max_n", "r14"."match_min_n", "r14"."parent_kind", "r14"."shape", "r14"."show_hide" FROM "qti"."associable_hotspot" AS "r14") AS "r15"("c32", "c33", "c34", "c35", "c36", "c37", "c38", "c39") WHERE "r15"."c38" = 'poly'::"qti"."shape") AS "r16"("c40")) AS "r17"("c41") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c54", "r22"."c55" FROM (SELECT "r21"."c50", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c46", "r20"."c47", "r20"."c48", "r20"."c49" FROM (SELECT DISTINCT "r19"."c42", "r19"."c43", "r19"."c44", "r19"."c45" FROM (SELECT DISTINCT "r18"."node", "r18"."owner_kind", "r18"."shape", "r18"."value" FROM "qti"."coords" AS "r18") AS "r19"("c42", "c43", "c44", "c45")) AS "r20"("c46", "c47", "c48", "c49")) AS "r21"("c50", "c51", "c52", "c53") GROUP BY "r21"."c50") AS "r22"("c54", "c55")) AS "r23"("c56", "c57") WHERE "r23"."c56" = "r17"."c41")) AS "r24"("c58") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c59")) AS "r26"("c60")) AS "r27"("c61")) THEN
    RAISE EXCEPTION 'law __associable_hotspot_shape_poly_capacity_coords_apzmy2slog is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__associable_hotspot_shape_poly_capacity_coords_apzmy2slog'::"pg_catalog"."text";
  END IF;
END
$$;
