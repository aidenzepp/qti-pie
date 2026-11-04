-- Validate law __csm_set_capacity_csm_metadata_oifer22dl3: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."csm_metadata", "qti"."csm_set" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_csm_set_capacity_csm_metadata_cbtwoqvm6k"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
BEGIN
  IF TG_TABLE_NAME = 'csm_set'::text THEN
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."csm_set" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      PERFORM 1 FROM "qti"."csm_metadata" AS "r1" WHERE "r1"."set" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __csm_set_capacity_csm_metadata_oifer22dl3 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__csm_set_capacity_csm_metadata_oifer22dl3'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["CsmSet",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["CsmSet"]'::text END;
      END IF;
    END LOOP;
  ELSE
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."csm_set" AS "r1" WHERE "r1"."id" = OLD."set" LOOP
      PERFORM 1 FROM "qti"."csm_metadata" AS "r1" WHERE "r1"."set" = "t"."c1" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __csm_set_capacity_csm_metadata_oifer22dl3 violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__csm_set_capacity_csm_metadata_oifer22dl3'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["CsmSet",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["CsmSet"]'::text END;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_csm_set_capacity_csm_metadata_cbtwoqvm6k"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_csm_set_capacity_csm_metadata_pvtu2rqnnf"
  AFTER DELETE ON "qti"."csm_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_csm_set_capacity_csm_metadata_cbtwoqvm6k"();

CREATE CONSTRAINT TRIGGER "__law_csm_set_capacity_csm_metadata_2e5aojxlfg"
  AFTER INSERT ON "qti"."csm_set"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_csm_set_capacity_csm_metadata_cbtwoqvm6k"();

-- The full violation query of law __csm_set_capacity_csm_metadata_oifer22dl3.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c37" AS "id" FROM (SELECT "r13"."c19" FROM (SELECT DISTINCT "r12"."c17" FROM (SELECT DISTINCT "r11"."c15", "r11"."c16" FROM (SELECT DISTINCT "r4"."c4", "r10"."c14" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."host", "r1"."id" FROM "qti"."csm_set" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c11", "r9"."c12" FROM (SELECT "r8"."c10", count(*) FROM (SELECT DISTINCT "r7"."c7", "r7"."c8" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6" FROM (SELECT DISTINCT "r5"."id", "r5"."set" FROM "qti"."csm_metadata" AS "r5") AS "r6"("c5", "c6")) AS "r7"("c7", "c8")) AS "r8"("c9", "c10") GROUP BY "r8"."c10") AS "r9"("c11", "c12")) AS "r10"("c13", "c14") WHERE "r4"."c4" = "r10"."c13") AS "r11"("c15", "c16") WHERE "r11"."c16" < 1::bigint) AS "r12"("c17", "c18")) AS "r13"("c19") UNION SELECT "r26"."c36" FROM (SELECT DISTINCT "r25"."c35" FROM (SELECT DISTINCT "r24"."c34" FROM (SELECT DISTINCT "r17"."c23" FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c21" FROM (SELECT DISTINCT "r14"."host", "r14"."id" FROM "qti"."csm_set" AS "r14") AS "r15"("c20", "c21")) AS "r16"("c22")) AS "r17"("c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c30", "r22"."c31" FROM (SELECT "r21"."c29", count(*) FROM (SELECT DISTINCT "r20"."c26", "r20"."c27" FROM (SELECT DISTINCT "r19"."c24", "r19"."c25" FROM (SELECT DISTINCT "r18"."id", "r18"."set" FROM "qti"."csm_metadata" AS "r18") AS "r19"("c24", "c25")) AS "r20"("c26", "c27")) AS "r21"("c28", "c29") GROUP BY "r21"."c29") AS "r22"("c30", "c31")) AS "r23"("c32", "c33") WHERE "r23"."c32" = "r17"."c23")) AS "r24"("c34") WHERE 0::bigint < 1::bigint) AS "r25"("c35")) AS "r26"("c36")) AS "r27"("c37")) THEN
    RAISE EXCEPTION 'law __csm_set_capacity_csm_metadata_oifer22dl3 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__csm_set_capacity_csm_metadata_oifer22dl3'::text;
  END IF;
END
$$;
