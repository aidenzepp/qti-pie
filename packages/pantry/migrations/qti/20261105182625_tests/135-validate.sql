-- Validate law __x_include_capacity_x_include_xpointer_vbrikbkobe: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."x_include", "qti"."x_include_xpointer" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_lcntbn6q3c"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."x_include" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."x_include_xpointer" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."x_include_xpointer" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
      IF "g"."c1" > 0::bigint THEN
        RAISE EXCEPTION 'law __x_include_capacity_x_include_xpointer_vbrikbkobe violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__x_include_capacity_x_include_xpointer_vbrikbkobe'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["XInclude",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["XInclude"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_lcntbn6q3c"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_m6ypamvu5f"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."x_include" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."x_include_xpointer" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."x_include_xpointer" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
      IF "g"."c1" > 0::bigint THEN
        RAISE EXCEPTION 'law __x_include_capacity_x_include_xpointer_vbrikbkobe violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__x_include_capacity_x_include_xpointer_vbrikbkobe'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["XInclude",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["XInclude"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_m6ypamvu5f"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_x_include_capacity_x_include_xpointer_bstiviaw2u"
  AFTER INSERT ON "qti"."x_include"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_lcntbn6q3c"();

CREATE CONSTRAINT TRIGGER "__law_x_include_capacity_x_include_xpointer_ofjxkl43om"
  AFTER INSERT ON "qti"."x_include_xpointer"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_x_include_capacity_x_include_xpointer_m6ypamvu5f"();

-- The full violation query of law __x_include_capacity_x_include_xpointer_vbrikbkobe.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c18" AS "id" FROM (SELECT DISTINCT "r12"."c16" FROM (SELECT DISTINCT "r11"."c14", "r11"."c15" FROM (SELECT DISTINCT "r4"."c3", "r10"."c13" FROM (SELECT DISTINCT "r3"."c2" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id" FROM "qti"."x_include" AS "r1") AS "r2"("c1")) AS "r3"("c2")) AS "r4"("c3"), (SELECT DISTINCT "r9"."c10", "r9"."c11" FROM (SELECT "r8"."c8", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c6", "r7"."c7" FROM (SELECT DISTINCT "r6"."c4", "r6"."c5" FROM (SELECT DISTINCT "r5"."node", "r5"."value" FROM "qti"."x_include_xpointer" AS "r5") AS "r6"("c4", "c5")) AS "r7"("c6", "c7")) AS "r8"("c8", "c9") GROUP BY "r8"."c8") AS "r9"("c10", "c11")) AS "r10"("c12", "c13") WHERE "r4"."c3" = "r10"."c12") AS "r11"("c14", "c15") WHERE "r11"."c15" < 0::bigint OR "r11"."c15" > 0::bigint) AS "r12"("c16", "c17")) AS "r13"("c18")) THEN
    RAISE EXCEPTION 'law __x_include_capacity_x_include_xpointer_vbrikbkobe is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__x_include_capacity_x_include_xpointer_vbrikbkobe'::"pg_catalog"."text";
  END IF;
END
$$;
