-- Validate law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."gap", "qti"."gap_match_binding" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_sc35faocme"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'gap_match_binding'::text THEN
    IF NEW."cardinality" = 'single'::"qti"."typed_cardinality" THEN
      FOR "t" IN SELECT "r1"."node" AS "c1", "r1"."cardinality" AS "c2" FROM "qti"."gap_match_binding" AS "r1" WHERE "r1"."node" = NEW."node" LOOP
        IF "t"."c2" = 'single'::"qti"."typed_cardinality" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."gap" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."gap" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
            IF "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GapMatchBinding",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["GapMatchBinding"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "t" IN SELECT "r1"."node" AS "c1", "r1"."cardinality" AS "c2" FROM "qti"."gap_match_binding" AS "r1" WHERE "r1"."node" = NEW."interaction" LOOP
      IF "t"."c2" = 'single'::"qti"."typed_cardinality" THEN
        FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."gap" AS "r1" WHERE "r1"."interaction" = "t"."c1" GROUP BY "r1"."interaction") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."gap" AS "r3" WHERE "r3"."interaction" = "t"."c1") LOOP
          IF "g"."c1" > 1::bigint THEN
            RAISE EXCEPTION 'law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["GapMatchBinding",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["GapMatchBinding"]'::text END;
          END IF;
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_sc35faocme"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_gap_match_binding_cardinality_single_capacity_ocx4zfmwoj"
  AFTER INSERT ON "qti"."gap"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_sc35faocme"();

CREATE CONSTRAINT TRIGGER "__law_gap_match_binding_cardinality_single_capacity_ykunjjzxb2"
  AFTER INSERT ON "qti"."gap_match_binding"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_gap_match_binding_cardinality_single_capacity_sc35faocme"();

-- The full violation query of law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c25" AS "node" FROM (SELECT DISTINCT "r12"."c23" FROM (SELECT DISTINCT "r11"."c21", "r11"."c22" FROM (SELECT DISTINCT "r4"."c4", "r10"."c20" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."cardinality", "r1"."node" FROM "qti"."gap_match_binding" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c1" = 'single'::"qti"."typed_cardinality") AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c17", "r9"."c18" FROM (SELECT "r8"."c15", count(*) FROM (SELECT DISTINCT "r7"."c9", "r7"."c10", "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6", "r6"."c7", "r6"."c8" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."required" FROM "qti"."gap" AS "r5") AS "r6"("c5", "c6", "c7", "c8")) AS "r7"("c9", "c10", "c11", "c12")) AS "r8"("c13", "c14", "c15", "c16") GROUP BY "r8"."c15") AS "r9"("c17", "c18")) AS "r10"("c19", "c20") WHERE "r4"."c4" = "r10"."c19") AS "r11"("c21", "c22") WHERE "r11"."c22" < 0::bigint OR "r11"."c22" > 1::bigint) AS "r12"("c23", "c24")) AS "r13"("c25")) THEN
    RAISE EXCEPTION 'law __gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__gap_match_binding_cardinality_single_capacity_gap_jmc2ktsv7q'::text;
  END IF;
END
$$;
