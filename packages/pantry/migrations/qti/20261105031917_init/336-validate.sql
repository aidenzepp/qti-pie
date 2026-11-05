-- Validate law __manifest_metadata_capacity_manifest_schema_version_v74e56faxz: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."manifest_metadata", "qti"."manifest_schema_version" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_iq2v3npqsi"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."manifest_metadata" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."manifest_schema_version" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_version_v74e56faxz violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_version_v74e56faxz'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ManifestMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ManifestMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_iq2v3npqsi"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_7gdkduypio"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."manifest_metadata" AS "r1" WHERE "r1"."id" = OLD."metadata" LOOP
    PERFORM 1 FROM "qti"."manifest_schema_version" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_version_v74e56faxz violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_version_v74e56faxz'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ManifestMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ManifestMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_7gdkduypio"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_manifest_metadata_capacity_manifest_schema_yglhwmr5jh"
  AFTER INSERT ON "qti"."manifest_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_iq2v3npqsi"();

CREATE CONSTRAINT TRIGGER "__law_manifest_metadata_capacity_manifest_schema_xralozl7xh"
  AFTER DELETE ON "qti"."manifest_schema_version"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_7gdkduypio"();

-- The full violation query of law __manifest_metadata_capacity_manifest_schema_version_v74e56faxz.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c49" AS "id" FROM (SELECT "r13"."c25" FROM (SELECT DISTINCT "r12"."c23" FROM (SELECT DISTINCT "r11"."c21", "r11"."c22" FROM (SELECT DISTINCT "r4"."c4", "r10"."c20" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."manifest" FROM "qti"."manifest_metadata" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c17", "r9"."c18" FROM (SELECT "r8"."c14", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c9", "r7"."c10", "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6", "r6"."c7", "r6"."c8" FROM (SELECT DISTINCT "r5"."id", "r5"."metadata", "r5"."package", "r5"."version" FROM "qti"."manifest_schema_version" AS "r5") AS "r6"("c5", "c6", "c7", "c8")) AS "r7"("c9", "c10", "c11", "c12")) AS "r8"("c13", "c14", "c15", "c16") GROUP BY "r8"."c14") AS "r9"("c17", "c18")) AS "r10"("c19", "c20") WHERE "r4"."c4" = "r10"."c19") AS "r11"("c21", "c22") WHERE "r11"."c22" < 1::bigint OR "r11"."c22" > 1::bigint) AS "r12"("c23", "c24")) AS "r13"("c25") UNION SELECT "r26"."c48" FROM (SELECT DISTINCT "r25"."c47" FROM (SELECT DISTINCT "r24"."c46" FROM (SELECT DISTINCT "r17"."c29" FROM (SELECT DISTINCT "r16"."c28" FROM (SELECT DISTINCT "r15"."c26" FROM (SELECT DISTINCT "r14"."id", "r14"."manifest" FROM "qti"."manifest_metadata" AS "r14") AS "r15"("c26", "c27")) AS "r16"("c28")) AS "r17"("c29") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c42", "r22"."c43" FROM (SELECT "r21"."c39", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c34", "r20"."c35", "r20"."c36", "r20"."c37" FROM (SELECT DISTINCT "r19"."c30", "r19"."c31", "r19"."c32", "r19"."c33" FROM (SELECT DISTINCT "r18"."id", "r18"."metadata", "r18"."package", "r18"."version" FROM "qti"."manifest_schema_version" AS "r18") AS "r19"("c30", "c31", "c32", "c33")) AS "r20"("c34", "c35", "c36", "c37")) AS "r21"("c38", "c39", "c40", "c41") GROUP BY "r21"."c39") AS "r22"("c42", "c43")) AS "r23"("c44", "c45") WHERE "r23"."c44" = "r17"."c29")) AS "r24"("c46") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c47")) AS "r26"("c48")) AS "r27"("c49")) THEN
    RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_version_v74e56faxz is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_version_v74e56faxz'::"pg_catalog"."text";
  END IF;
END
$$;
