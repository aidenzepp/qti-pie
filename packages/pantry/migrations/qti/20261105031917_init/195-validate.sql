-- Validate law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."gap", "qti"."gap_match_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_ofgnkuwz4p"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."node" AS "c1", "r1"."cardinality" AS "c2" FROM "qti"."gap_match_binding" AS "r1" WHERE "r1"."node" = NEW."interaction" LOOP
    IF "t"."c2" = 'single'::"qti"."typed_cardinality" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."gap" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."gap" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["GapMatchBinding",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["GapMatchBinding"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_ofgnkuwz4p"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_3ghxycibf5"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."node" AS "c1", "r1"."cardinality" AS "c2" FROM "qti"."gap_match_binding" AS "r1" WHERE "r1"."node" = NEW."node" LOOP
    IF "t"."c2" = 'single'::"qti"."typed_cardinality" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."gap" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."gap" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
        IF "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["GapMatchBinding",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["GapMatchBinding"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_3ghxycibf5"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_gap_match_binding_cardinality_single_capacity_nlcmlzgu5c"
  AFTER INSERT ON "qti"."gap"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_ofgnkuwz4p"();

CREATE CONSTRAINT TRIGGER "__law_gap_match_binding_cardinality_single_capacity_lvijysi4tr"
  AFTER INSERT ON "qti"."gap_match_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."cardinality" = 'single'::"qti"."typed_cardinality")
  EXECUTE FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_3ghxycibf5"();

-- The full violation query of law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c28" AS "node" FROM (SELECT DISTINCT "r12"."c26" FROM (SELECT DISTINCT "r11"."c24", "r11"."c25" FROM (SELECT DISTINCT "r4"."c4", "r10"."c23" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."cardinality", "r1"."node" FROM "qti"."gap_match_binding" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c1" = 'single'::"qti"."typed_cardinality") AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c20", "r9"."c21" FROM (SELECT "r8"."c17", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c10", "r7"."c11", "r7"."c12", "r7"."c13", "r7"."c14" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6", "r6"."c7", "r6"."c8", "r6"."c9" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."required", "r5"."show_hide" FROM "qti"."gap" AS "r5") AS "r6"("c5", "c6", "c7", "c8", "c9")) AS "r7"("c10", "c11", "c12", "c13", "c14")) AS "r8"("c15", "c16", "c17", "c18", "c19") GROUP BY "r8"."c17") AS "r9"("c20", "c21")) AS "r10"("c22", "c23") WHERE "r4"."c4" = "r10"."c22") AS "r11"("c24", "c25") WHERE "r11"."c25" < 0::bigint OR "r11"."c25" > 1::bigint) AS "r12"("c26", "c27")) AS "r13"("c28")) THEN
    RAISE EXCEPTION 'law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q'::"pg_catalog"."text";
  END IF;
END
$$;
