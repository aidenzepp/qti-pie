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
  IF EXISTS (SELECT "r25"."c35" AS "id" FROM (WITH "r4"("c4") AS MATERIALIZED (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."manifest" FROM "qti"."manifest_metadata" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")), "r12"("c20", "c21") AS MATERIALIZED (SELECT DISTINCT "r11"."c18", "r11"."c19" FROM (SELECT "r10"."c15", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c10", "r9"."c11", "r9"."c12", "r9"."c13" FROM (SELECT DISTINCT "r8"."c6", "r8"."c7", "r8"."c8", "r8"."c9" FROM (SELECT DISTINCT "r7"."id", "r7"."metadata", "r7"."package", "r7"."version" FROM "qti"."manifest_schema_version" AS "r7") AS "r8"("c6", "c7", "c8", "c9")) AS "r9"("c10", "c11", "c12", "c13")) AS "r10"("c14", "c15", "c16", "c17") GROUP BY "r10"."c15") AS "r11"("c18", "c19")) SELECT "r17"."c28" FROM (SELECT DISTINCT "r16"."c26" FROM (SELECT DISTINCT "r15"."c24", "r15"."c25" FROM (SELECT DISTINCT "r6"."c5", "r14"."c23" FROM (SELECT "r5"."c4" FROM "r4" AS "r5") AS "r6"("c5"), (SELECT "r13"."c20", "r13"."c21" FROM "r12" AS "r13") AS "r14"("c22", "c23") WHERE "r6"."c5" = "r14"."c22") AS "r15"("c24", "c25") WHERE "r15"."c25" < 1::bigint OR "r15"."c25" > 1::bigint) AS "r16"("c26", "c27")) AS "r17"("c28") UNION SELECT "r24"."c34" FROM (SELECT DISTINCT "r23"."c33" FROM (SELECT DISTINCT "r22"."c32" FROM (SELECT DISTINCT "r19"."c29" FROM (SELECT "r18"."c4" FROM "r4" AS "r18") AS "r19"("c29") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c20", "r20"."c21" FROM "r12" AS "r20") AS "r21"("c30", "c31") WHERE "r21"."c30" = "r19"."c29")) AS "r22"("c32") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c33")) AS "r24"("c34")) AS "r25"("c35")) THEN
    RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_version_v74e56faxz is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_version_v74e56faxz'::"pg_catalog"."text";
  END IF;
END
$$;
