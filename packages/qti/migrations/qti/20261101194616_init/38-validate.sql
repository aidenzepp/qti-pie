-- Validate law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_identifier", "qti"."resource_lom_identified" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_3ertx4jjrz"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
BEGIN
  IF TG_TABLE_NAME = 'resource_lom_identified'::text THEN
    FOR "t" IN SELECT "r1"."lom" AS "c1" FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = NEW."lom" LOOP
      PERFORM 1 FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__resource_lom_identified_capacity_lom_identifier_7pnhbhckku'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ResourceLomIdentified",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ResourceLomIdentified"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "t" IN SELECT "r1"."lom" AS "c1" FROM "qti"."resource_lom_identified" AS "r1" WHERE "r1"."lom" = OLD."lom" LOOP
      PERFORM 1 FROM "qti"."lom_identifier" AS "r1" WHERE "r1"."lom" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__resource_lom_identified_capacity_lom_identifier_7pnhbhckku'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ResourceLomIdentified",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ResourceLomIdentified"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_3ertx4jjrz"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_resource_lom_identified_capacity_lom_jri5j54oyk"
  AFTER DELETE ON "qti"."lom_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_3ertx4jjrz"();

CREATE CONSTRAINT TRIGGER "__law_resource_lom_identified_capacity_lom_uld7hppwtf"
  AFTER INSERT ON "qti"."resource_lom_identified"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_resource_lom_identified_capacity_lom_3ertx4jjrz"();

-- The full violation query of law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c53" AS "lom" FROM (SELECT "r13"."c27" FROM (SELECT DISTINCT "r12"."c25" FROM (SELECT DISTINCT "r11"."c23", "r11"."c24" FROM (SELECT DISTINCT "r4"."c6", "r10"."c22" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."lom", "r1"."package", "r1"."resource", "r1"."type" FROM "qti"."resource_lom_identified" AS "r1") AS "r2"("c1", "c2", "c3", "c4")) AS "r3"("c5")) AS "r4"("c6"), (SELECT DISTINCT "r9"."c19", "r9"."c20" FROM (SELECT "r8"."c16", count(*) FROM (SELECT DISTINCT "r7"."c11", "r7"."c12", "r7"."c13", "r7"."c14" FROM (SELECT DISTINCT "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."lom", "r5"."owner", "r5"."position" FROM "qti"."lom_identifier" AS "r5") AS "r6"("c7", "c8", "c9", "c10")) AS "r7"("c11", "c12", "c13", "c14")) AS "r8"("c15", "c16", "c17", "c18") GROUP BY "r8"."c16") AS "r9"("c19", "c20")) AS "r10"("c21", "c22") WHERE "r4"."c6" = "r10"."c21") AS "r11"("c23", "c24") WHERE "r11"."c24" < 1::bigint) AS "r12"("c25", "c26")) AS "r13"("c27") UNION SELECT "r26"."c52" FROM (SELECT DISTINCT "r25"."c51" FROM (SELECT DISTINCT "r24"."c50" FROM (SELECT DISTINCT "r17"."c33" FROM (SELECT DISTINCT "r16"."c32" FROM (SELECT DISTINCT "r15"."c28" FROM (SELECT DISTINCT "r14"."lom", "r14"."package", "r14"."resource", "r14"."type" FROM "qti"."resource_lom_identified" AS "r14") AS "r15"("c28", "c29", "c30", "c31")) AS "r16"("c32")) AS "r17"("c33") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c46", "r22"."c47" FROM (SELECT "r21"."c43", count(*) FROM (SELECT DISTINCT "r20"."c38", "r20"."c39", "r20"."c40", "r20"."c41" FROM (SELECT DISTINCT "r19"."c34", "r19"."c35", "r19"."c36", "r19"."c37" FROM (SELECT DISTINCT "r18"."id", "r18"."lom", "r18"."owner", "r18"."position" FROM "qti"."lom_identifier" AS "r18") AS "r19"("c34", "c35", "c36", "c37")) AS "r20"("c38", "c39", "c40", "c41")) AS "r21"("c42", "c43", "c44", "c45") GROUP BY "r21"."c43") AS "r22"("c46", "c47")) AS "r23"("c48", "c49") WHERE "r23"."c48" = "r17"."c33")) AS "r24"("c50") WHERE 0::bigint < 1::bigint) AS "r25"("c51")) AS "r26"("c52")) AS "r27"("c53")) THEN
    RAISE EXCEPTION 'law __resource_lom_identified_capacity_lom_identifier_7pnhbhckku is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__resource_lom_identified_capacity_lom_identifier_7pnhbhckku'::text;
  END IF;
END
$$;
