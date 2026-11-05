-- Validate law __csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."csm_guid", "qti"."csm_labelled_guid" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_kcvtxj67tq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."csm_labelled_guid" AS "r1" WHERE "r1"."id" = OLD."labelled_guid" LOOP
    PERFORM 1 FROM "qti"."csm_guid" AS "r1" WHERE "r1"."labelled_guid" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["CsmLabelledGuid",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["CsmLabelledGuid"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_kcvtxj67tq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_iyd7wovylw"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."csm_labelled_guid" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."csm_guid" AS "r1" WHERE "r1"."labelled_guid" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5 violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["CsmLabelledGuid",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["CsmLabelledGuid"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_iyd7wovylw"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_csm_labelled_guid_capacity_csm_guid_hk3zfgu7zf"
  AFTER DELETE ON "qti"."csm_guid"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_kcvtxj67tq"();

CREATE CONSTRAINT TRIGGER "__law_csm_labelled_guid_capacity_csm_guid_h63oamhel2"
  AFTER INSERT ON "qti"."csm_labelled_guid"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_csm_labelled_guid_capacity_csm_guid_iyd7wovylw"();

-- The full violation query of law __csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c32" AS "id" FROM (WITH "r4"("c4") AS MATERIALIZED (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."set_of_guids" FROM "qti"."csm_labelled_guid" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")), "r12"("c17", "c18") AS MATERIALIZED (SELECT DISTINCT "r11"."c15", "r11"."c16" FROM (SELECT "r10"."c13", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c9", "r9"."c10", "r9"."c11" FROM (SELECT DISTINCT "r8"."c6", "r8"."c7", "r8"."c8" FROM (SELECT DISTINCT "r7"."id", "r7"."labelled_guid", "r7"."value" FROM "qti"."csm_guid" AS "r7") AS "r8"("c6", "c7", "c8")) AS "r9"("c9", "c10", "c11")) AS "r10"("c12", "c13", "c14") GROUP BY "r10"."c13") AS "r11"("c15", "c16")) SELECT "r17"."c25" FROM (SELECT DISTINCT "r16"."c23" FROM (SELECT DISTINCT "r15"."c21", "r15"."c22" FROM (SELECT DISTINCT "r6"."c5", "r14"."c20" FROM (SELECT "r5"."c4" FROM "r4" AS "r5") AS "r6"("c5"), (SELECT "r13"."c17", "r13"."c18" FROM "r12" AS "r13") AS "r14"("c19", "c20") WHERE "r6"."c5" = "r14"."c19") AS "r15"("c21", "c22") WHERE "r15"."c22" < 1::bigint OR "r15"."c22" > 1::bigint) AS "r16"("c23", "c24")) AS "r17"("c25") UNION SELECT "r24"."c31" FROM (SELECT DISTINCT "r23"."c30" FROM (SELECT DISTINCT "r22"."c29" FROM (SELECT DISTINCT "r19"."c26" FROM (SELECT "r18"."c4" FROM "r4" AS "r18") AS "r19"("c26") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c17", "r20"."c18" FROM "r12" AS "r20") AS "r21"("c27", "c28") WHERE "r21"."c27" = "r19"."c26")) AS "r22"("c29") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c30")) AS "r24"("c31")) AS "r25"("c32")) THEN
    RAISE EXCEPTION 'law __csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__csm_labelled_guid_capacity_csm_guid_gnjy3sgmo5'::"pg_catalog"."text";
  END IF;
END
$$;
