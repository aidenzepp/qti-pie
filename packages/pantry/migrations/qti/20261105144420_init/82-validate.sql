-- Validate law __csm_metadata_capacity_csm_set_of_guids_moujde4sg5: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."csm_metadata", "qti"."csm_set_of_guids" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_ivslct3s7u"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."csm_metadata" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."csm_set_of_guids" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __csm_metadata_capacity_csm_set_of_guids_moujde4sg5 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__csm_metadata_capacity_csm_set_of_guids_moujde4sg5'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["CsmMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["CsmMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_ivslct3s7u"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_jmpj4ualpj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."csm_metadata" AS "r1" WHERE "r1"."id" = OLD."metadata" LOOP
    PERFORM 1 FROM "qti"."csm_set_of_guids" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __csm_metadata_capacity_csm_set_of_guids_moujde4sg5 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__csm_metadata_capacity_csm_set_of_guids_moujde4sg5'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["CsmMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["CsmMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_jmpj4ualpj"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_csm_metadata_capacity_csm_set_of_guids_gllzkrhdci"
  AFTER INSERT ON "qti"."csm_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_ivslct3s7u"();

CREATE CONSTRAINT TRIGGER "__law_csm_metadata_capacity_csm_set_of_guids_gx2xdmn2uh"
  AFTER DELETE ON "qti"."csm_set_of_guids"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_csm_metadata_capacity_csm_set_of_guids_jmpj4ualpj"();

-- The full violation query of law __csm_metadata_capacity_csm_set_of_guids_moujde4sg5.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c29" AS "id" FROM (WITH "r4"("c4") AS MATERIALIZED (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."set" FROM "qti"."csm_metadata" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")), "r12"("c14", "c15") AS MATERIALIZED (SELECT DISTINCT "r11"."c12", "r11"."c13" FROM (SELECT "r10"."c11", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c8", "r9"."c9" FROM (SELECT DISTINCT "r8"."c6", "r8"."c7" FROM (SELECT DISTINCT "r7"."id", "r7"."metadata" FROM "qti"."csm_set_of_guids" AS "r7") AS "r8"("c6", "c7")) AS "r9"("c8", "c9")) AS "r10"("c10", "c11") GROUP BY "r10"."c11") AS "r11"("c12", "c13")) SELECT "r17"."c22" FROM (SELECT DISTINCT "r16"."c20" FROM (SELECT DISTINCT "r15"."c18", "r15"."c19" FROM (SELECT DISTINCT "r6"."c5", "r14"."c17" FROM (SELECT "r5"."c4" FROM "r4" AS "r5") AS "r6"("c5"), (SELECT "r13"."c14", "r13"."c15" FROM "r12" AS "r13") AS "r14"("c16", "c17") WHERE "r6"."c5" = "r14"."c16") AS "r15"("c18", "c19") WHERE "r15"."c19" < 1::bigint) AS "r16"("c20", "c21")) AS "r17"("c22") UNION SELECT "r24"."c28" FROM (SELECT DISTINCT "r23"."c27" FROM (SELECT DISTINCT "r22"."c26" FROM (SELECT DISTINCT "r19"."c23" FROM (SELECT "r18"."c4" FROM "r4" AS "r18") AS "r19"("c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c14", "r20"."c15" FROM "r12" AS "r20") AS "r21"("c24", "c25") WHERE "r21"."c24" = "r19"."c23")) AS "r22"("c26") WHERE 0::bigint < 1::bigint) AS "r23"("c27")) AS "r24"("c28")) AS "r25"("c29")) THEN
    RAISE EXCEPTION 'law __csm_metadata_capacity_csm_set_of_guids_moujde4sg5 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__csm_metadata_capacity_csm_set_of_guids_moujde4sg5'::"pg_catalog"."text";
  END IF;
END
$$;
