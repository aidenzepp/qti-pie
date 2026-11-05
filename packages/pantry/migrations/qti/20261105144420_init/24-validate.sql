-- Validate law __associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."associable_hotspot", "qti"."coords" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_aidnwfws7f"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'circle'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssociableHotspot",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssociableHotspot"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_aidnwfws7f"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_5fbuvceciq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
    IF "t"."c2" = 'circle'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssociableHotspot",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssociableHotspot"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_5fbuvceciq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_ltsvkly6g5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."shape" AS "c2" FROM "qti"."associable_hotspot" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = 'circle'::"qti"."shape" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."coords" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."coords" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["AssociableHotspot",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["AssociableHotspot"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_ltsvkly6g5"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_circle_capacity_abjljn55x2"
  AFTER INSERT ON "qti"."associable_hotspot"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."shape" = 'circle'::"qti"."shape")
  EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_aidnwfws7f"();

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_circle_capacity_6x7idec6gv"
  AFTER DELETE ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_5fbuvceciq"();

CREATE CONSTRAINT TRIGGER "__law_associable_hotspot_shape_circle_capacity_pyuvrise7a"
  AFTER INSERT ON "qti"."coords"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_associable_hotspot_shape_circle_capacity_ltsvkly6g5"();

-- The full violation query of law __associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c41" AS "id" FROM (WITH "r4"("c10") AS MATERIALIZED (SELECT DISTINCT "r3"."c9" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."interaction", "r1"."match_max_n", "r1"."match_min_n", "r1"."parent_kind", "r1"."shape", "r1"."show_hide" FROM "qti"."associable_hotspot" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8") WHERE "r2"."c7" = 'circle'::"qti"."shape") AS "r3"("c9")), "r12"("c26", "c27") AS MATERIALIZED (SELECT DISTINCT "r11"."c24", "r11"."c25" FROM (SELECT "r10"."c20", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c16", "r9"."c17", "r9"."c18", "r9"."c19" FROM (SELECT DISTINCT "r8"."c12", "r8"."c13", "r8"."c14", "r8"."c15" FROM (SELECT DISTINCT "r7"."node", "r7"."owner_kind", "r7"."shape", "r7"."value" FROM "qti"."coords" AS "r7") AS "r8"("c12", "c13", "c14", "c15")) AS "r9"("c16", "c17", "c18", "c19")) AS "r10"("c20", "c21", "c22", "c23") GROUP BY "r10"."c20") AS "r11"("c24", "c25")) SELECT "r17"."c34" FROM (SELECT DISTINCT "r16"."c32" FROM (SELECT DISTINCT "r15"."c30", "r15"."c31" FROM (SELECT DISTINCT "r6"."c11", "r14"."c29" FROM (SELECT "r5"."c10" FROM "r4" AS "r5") AS "r6"("c11"), (SELECT "r13"."c26", "r13"."c27" FROM "r12" AS "r13") AS "r14"("c28", "c29") WHERE "r6"."c11" = "r14"."c28") AS "r15"("c30", "c31") WHERE "r15"."c31" < 1::bigint OR "r15"."c31" > 1::bigint) AS "r16"("c32", "c33")) AS "r17"("c34") UNION SELECT "r24"."c40" FROM (SELECT DISTINCT "r23"."c39" FROM (SELECT DISTINCT "r22"."c38" FROM (SELECT DISTINCT "r19"."c35" FROM (SELECT "r18"."c10" FROM "r4" AS "r18") AS "r19"("c35") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c26", "r20"."c27" FROM "r12" AS "r20") AS "r21"("c36", "c37") WHERE "r21"."c36" = "r19"."c35")) AS "r22"("c38") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c39")) AS "r24"("c40")) AS "r25"("c41")) THEN
    RAISE EXCEPTION 'law __associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__associable_hotspot_shape_circle_capacity_coords_y5f7bkjggp'::"pg_catalog"."text";
  END IF;
END
$$;
