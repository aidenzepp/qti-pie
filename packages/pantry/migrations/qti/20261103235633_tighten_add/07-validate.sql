-- Validate law __round_to_figures_kind_ref_capacity_round_to_ygatiz2iab: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."round_to", "qti"."round_to_figures_ref" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_round_to_figures_kind_ref_capacity_round_to_yasft6vqmg"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'round_to'::text THEN
    IF NEW."figures_kind" = 'ref'::"qti"."ref_or_literal" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."figures_kind" AS "c2" FROM "qti"."round_to" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."round_to_figures_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."round_to_figures_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __round_to_figures_kind_ref_capacity_round_to_ygatiz2iab violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__round_to_figures_kind_ref_capacity_round_to_ygatiz2iab'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["RoundTo",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["RoundTo"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."figures_kind" AS "c2" FROM "qti"."round_to" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
        IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."round_to_figures_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."round_to_figures_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __round_to_figures_kind_ref_capacity_round_to_ygatiz2iab violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__round_to_figures_kind_ref_capacity_round_to_ygatiz2iab'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["RoundTo",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["RoundTo"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    ELSE
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."figures_kind" AS "c2" FROM "qti"."round_to" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
        IF "t"."c2" = 'ref'::"qti"."ref_or_literal" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."round_to_figures_ref" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."round_to_figures_ref" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __round_to_figures_kind_ref_capacity_round_to_ygatiz2iab violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__round_to_figures_kind_ref_capacity_round_to_ygatiz2iab'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["RoundTo",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["RoundTo"]'::text END;
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_round_to_figures_kind_ref_capacity_round_to_yasft6vqmg"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_round_to_figures_kind_ref_capacity_round_to_ke2avr4dsz"
  AFTER INSERT ON "qti"."round_to"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_round_to_figures_kind_ref_capacity_round_to_yasft6vqmg"();

CREATE CONSTRAINT TRIGGER "__law_round_to_figures_kind_ref_capacity_round_to_fssvvswnrd"
  AFTER INSERT OR DELETE ON "qti"."round_to_figures_ref"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_round_to_figures_kind_ref_capacity_round_to_yasft6vqmg"();

-- The full violation query of law __round_to_figures_kind_ref_capacity_round_to_ygatiz2iab.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c41" AS "id" FROM (SELECT "r13"."c21" FROM (SELECT DISTINCT "r12"."c19" FROM (SELECT DISTINCT "r11"."c17", "r11"."c18" FROM (SELECT DISTINCT "r4"."c6", "r10"."c16" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c3" FROM (SELECT DISTINCT "r1"."figures_kind", "r1"."figures_value", "r1"."id", "r1"."rounding_mode" FROM "qti"."round_to" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c1" = 'ref'::"qti"."ref_or_literal") AS "r3"("c5")) AS "r4"("c6"), (SELECT DISTINCT "r9"."c13", "r9"."c14" FROM (SELECT "r8"."c12", count(*) FROM (SELECT DISTINCT "r7"."c9", "r7"."c10" FROM (SELECT DISTINCT "r6"."c7", "r6"."c8" FROM (SELECT DISTINCT "r5"."identifier", "r5"."node" FROM "qti"."round_to_figures_ref" AS "r5") AS "r6"("c7", "c8")) AS "r7"("c9", "c10")) AS "r8"("c11", "c12") GROUP BY "r8"."c12") AS "r9"("c13", "c14")) AS "r10"("c15", "c16") WHERE "r4"."c6" = "r10"."c15") AS "r11"("c17", "c18") WHERE "r11"."c18" < 1::bigint OR "r11"."c18" > 1::bigint) AS "r12"("c19", "c20")) AS "r13"("c21") UNION SELECT "r26"."c40" FROM (SELECT DISTINCT "r25"."c39" FROM (SELECT DISTINCT "r24"."c38" FROM (SELECT DISTINCT "r17"."c27" FROM (SELECT DISTINCT "r16"."c26" FROM (SELECT DISTINCT "r15"."c24" FROM (SELECT DISTINCT "r14"."figures_kind", "r14"."figures_value", "r14"."id", "r14"."rounding_mode" FROM "qti"."round_to" AS "r14") AS "r15"("c22", "c23", "c24", "c25") WHERE "r15"."c22" = 'ref'::"qti"."ref_or_literal") AS "r16"("c26")) AS "r17"("c27") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c34", "r22"."c35" FROM (SELECT "r21"."c33", count(*) FROM (SELECT DISTINCT "r20"."c30", "r20"."c31" FROM (SELECT DISTINCT "r19"."c28", "r19"."c29" FROM (SELECT DISTINCT "r18"."identifier", "r18"."node" FROM "qti"."round_to_figures_ref" AS "r18") AS "r19"("c28", "c29")) AS "r20"("c30", "c31")) AS "r21"("c32", "c33") GROUP BY "r21"."c33") AS "r22"("c34", "c35")) AS "r23"("c36", "c37") WHERE "r23"."c36" = "r17"."c27")) AS "r24"("c38") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c39")) AS "r26"("c40")) AS "r27"("c41")) THEN
    RAISE EXCEPTION 'law __round_to_figures_kind_ref_capacity_round_to_ygatiz2iab is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__round_to_figures_kind_ref_capacity_round_to_ygatiz2iab'::text;
  END IF;
END
$$;
