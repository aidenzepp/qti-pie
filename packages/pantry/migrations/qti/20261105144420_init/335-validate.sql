-- Validate law __manifest_metadata_capacity_manifest_schema_5acxkx5tni: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."manifest_metadata", "qti"."manifest_schema" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_edyaci3igl"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."manifest_metadata" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."manifest_schema" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_5acxkx5tni violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_5acxkx5tni'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ManifestMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ManifestMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_edyaci3igl"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_f43rxzhbnr"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."manifest_metadata" AS "r1" WHERE "r1"."id" = OLD."metadata" LOOP
    PERFORM 1 FROM "qti"."manifest_schema" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_5acxkx5tni violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_5acxkx5tni'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ManifestMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ManifestMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_f43rxzhbnr"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_manifest_metadata_capacity_manifest_schema_2tdosi4b2e"
  AFTER INSERT ON "qti"."manifest_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_edyaci3igl"();

CREATE CONSTRAINT TRIGGER "__law_manifest_metadata_capacity_manifest_schema_7esvtd6wks"
  AFTER DELETE ON "qti"."manifest_schema"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_manifest_metadata_capacity_manifest_schema_f43rxzhbnr"();

-- The full violation query of law __manifest_metadata_capacity_manifest_schema_5acxkx5tni.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c32" AS "id" FROM (WITH "r4"("c4") AS MATERIALIZED (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."manifest" FROM "qti"."manifest_metadata" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")), "r12"("c17", "c18") AS MATERIALIZED (SELECT DISTINCT "r11"."c15", "r11"."c16" FROM (SELECT "r10"."c13", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c9", "r9"."c10", "r9"."c11" FROM (SELECT DISTINCT "r8"."c6", "r8"."c7", "r8"."c8" FROM (SELECT DISTINCT "r7"."id", "r7"."metadata", "r7"."value" FROM "qti"."manifest_schema" AS "r7") AS "r8"("c6", "c7", "c8")) AS "r9"("c9", "c10", "c11")) AS "r10"("c12", "c13", "c14") GROUP BY "r10"."c13") AS "r11"("c15", "c16")) SELECT "r17"."c25" FROM (SELECT DISTINCT "r16"."c23" FROM (SELECT DISTINCT "r15"."c21", "r15"."c22" FROM (SELECT DISTINCT "r6"."c5", "r14"."c20" FROM (SELECT "r5"."c4" FROM "r4" AS "r5") AS "r6"("c5"), (SELECT "r13"."c17", "r13"."c18" FROM "r12" AS "r13") AS "r14"("c19", "c20") WHERE "r6"."c5" = "r14"."c19") AS "r15"("c21", "c22") WHERE "r15"."c22" < 1::bigint OR "r15"."c22" > 1::bigint) AS "r16"("c23", "c24")) AS "r17"("c25") UNION SELECT "r24"."c31" FROM (SELECT DISTINCT "r23"."c30" FROM (SELECT DISTINCT "r22"."c29" FROM (SELECT DISTINCT "r19"."c26" FROM (SELECT "r18"."c4" FROM "r4" AS "r18") AS "r19"("c26") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c17", "r20"."c18" FROM "r12" AS "r20") AS "r21"("c27", "c28") WHERE "r21"."c27" = "r19"."c26")) AS "r22"("c29") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c30")) AS "r24"("c31")) AS "r25"("c32")) THEN
    RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_5acxkx5tni is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_5acxkx5tni'::"pg_catalog"."text";
  END IF;
END
$$;
