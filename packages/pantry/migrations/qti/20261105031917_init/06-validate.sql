-- Validate law __variant_metadata_capacity_access_for_all_resource_waqx5nzc7h: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."access_for_all_resource", "qti"."variant_metadata" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_v76p55wyi6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."variant_metadata" AS "r1" WHERE "r1"."id" = OLD."metadata" LOOP
    PERFORM 1 FROM "qti"."access_for_all_resource" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __variant_metadata_capacity_access_for_all_resource_waqx5nzc7h violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__variant_metadata_capacity_access_for_all_resource_waqx5nzc7h'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariantMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariantMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_v76p55wyi6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_b2m4n2ywiz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."variant_metadata" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."access_for_all_resource" AS "r1" WHERE "r1"."metadata" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __variant_metadata_capacity_access_for_all_resource_waqx5nzc7h violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__variant_metadata_capacity_access_for_all_resource_waqx5nzc7h'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["VariantMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["VariantMetadata"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_b2m4n2ywiz"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_variant_metadata_capacity_access_for_all_od7lzp74ns"
  AFTER DELETE ON "qti"."access_for_all_resource"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_v76p55wyi6"();

CREATE CONSTRAINT TRIGGER "__law_variant_metadata_capacity_access_for_all_mgzwwhsqko"
  AFTER INSERT ON "qti"."variant_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variant_metadata_capacity_access_for_all_b2m4n2ywiz"();

-- The full violation query of law __variant_metadata_capacity_access_for_all_resource_waqx5nzc7h.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c37" AS "id" FROM (SELECT "r13"."c19" FROM (SELECT DISTINCT "r12"."c17" FROM (SELECT DISTINCT "r11"."c15", "r11"."c16" FROM (SELECT DISTINCT "r4"."c4", "r10"."c14" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."variant" FROM "qti"."variant_metadata" AS "r1") AS "r2"("c1", "c2")) AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c11", "r9"."c12" FROM (SELECT "r8"."c10", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c7", "r7"."c8" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6" FROM (SELECT DISTINCT "r5"."id", "r5"."metadata" FROM "qti"."access_for_all_resource" AS "r5") AS "r6"("c5", "c6")) AS "r7"("c7", "c8")) AS "r8"("c9", "c10") GROUP BY "r8"."c10") AS "r9"("c11", "c12")) AS "r10"("c13", "c14") WHERE "r4"."c4" = "r10"."c13") AS "r11"("c15", "c16") WHERE "r11"."c16" < 1::bigint OR "r11"."c16" > 1::bigint) AS "r12"("c17", "c18")) AS "r13"("c19") UNION SELECT "r26"."c36" FROM (SELECT DISTINCT "r25"."c35" FROM (SELECT DISTINCT "r24"."c34" FROM (SELECT DISTINCT "r17"."c23" FROM (SELECT DISTINCT "r16"."c22" FROM (SELECT DISTINCT "r15"."c20" FROM (SELECT DISTINCT "r14"."id", "r14"."variant" FROM "qti"."variant_metadata" AS "r14") AS "r15"("c20", "c21")) AS "r16"("c22")) AS "r17"("c23") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c30", "r22"."c31" FROM (SELECT "r21"."c29", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c26", "r20"."c27" FROM (SELECT DISTINCT "r19"."c24", "r19"."c25" FROM (SELECT DISTINCT "r18"."id", "r18"."metadata" FROM "qti"."access_for_all_resource" AS "r18") AS "r19"("c24", "c25")) AS "r20"("c26", "c27")) AS "r21"("c28", "c29") GROUP BY "r21"."c29") AS "r22"("c30", "c31")) AS "r23"("c32", "c33") WHERE "r23"."c32" = "r17"."c23")) AS "r24"("c34") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c35")) AS "r26"("c36")) AS "r27"("c37")) THEN
    RAISE EXCEPTION 'law __variant_metadata_capacity_access_for_all_resource_waqx5nzc7h is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__variant_metadata_capacity_access_for_all_resource_waqx5nzc7h'::"pg_catalog"."text";
  END IF;
END
$$;
