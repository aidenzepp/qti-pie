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
  IF EXISTS (SELECT "r27"."c43" AS "id" FROM (SELECT "r13"."c22" FROM (SELECT DISTINCT "r12"."c20" FROM (SELECT DISTINCT "r11"."c18", "r11"."c19" FROM (SELECT DISTINCT "r4"."c4", "r10"."c17" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."manifest" FROM "qti"."manifest_metadata" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c14", "r9"."c15" FROM (SELECT "r8"."c12", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c8", "r7"."c9", "r7"."c10" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6", "r6"."c7" FROM (SELECT DISTINCT "r5"."id", "r5"."metadata", "r5"."value" FROM "qti"."manifest_schema" AS "r5") AS "r6"("c5", "c6", "c7")) AS "r7"("c8", "c9", "c10")) AS "r8"("c11", "c12", "c13") GROUP BY "r8"."c12") AS "r9"("c14", "c15")) AS "r10"("c16", "c17") WHERE "r4"."c4" = "r10"."c16") AS "r11"("c18", "c19") WHERE "r11"."c19" < 1::bigint OR "r11"."c19" > 1::bigint) AS "r12"("c20", "c21")) AS "r13"("c22") UNION SELECT "r26"."c42" FROM (SELECT DISTINCT "r25"."c41" FROM (SELECT DISTINCT "r24"."c40" FROM (SELECT DISTINCT "r17"."c26" FROM (SELECT DISTINCT "r16"."c25" FROM (SELECT DISTINCT "r15"."c23" FROM (SELECT DISTINCT "r14"."id", "r14"."manifest" FROM "qti"."manifest_metadata" AS "r14") AS "r15"("c23", "c24")) AS "r16"("c25")) AS "r17"("c26") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c36", "r22"."c37" FROM (SELECT "r21"."c34", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c30", "r20"."c31", "r20"."c32" FROM (SELECT DISTINCT "r19"."c27", "r19"."c28", "r19"."c29" FROM (SELECT DISTINCT "r18"."id", "r18"."metadata", "r18"."value" FROM "qti"."manifest_schema" AS "r18") AS "r19"("c27", "c28", "c29")) AS "r20"("c30", "c31", "c32")) AS "r21"("c33", "c34", "c35") GROUP BY "r21"."c34") AS "r22"("c36", "c37")) AS "r23"("c38", "c39") WHERE "r23"."c38" = "r17"."c26")) AS "r24"("c40") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c41")) AS "r26"("c42")) AS "r27"("c43")) THEN
    RAISE EXCEPTION 'law __manifest_metadata_capacity_manifest_schema_5acxkx5tni is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__manifest_metadata_capacity_manifest_schema_5acxkx5tni'::"pg_catalog"."text";
  END IF;
END
$$;
