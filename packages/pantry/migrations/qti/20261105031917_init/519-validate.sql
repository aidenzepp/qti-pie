-- Validate law __variant_capacity_variant_metadata_jbonqirrvc: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."variant", "qti"."variant_metadata" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_variant_capacity_variant_metadata_uvuj4mys5s"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."variant" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."variant_metadata" AS "r1" WHERE "r1"."variant" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __variant_capacity_variant_metadata_jbonqirrvc violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__variant_capacity_variant_metadata_jbonqirrvc'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Variant",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Variant"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variant_capacity_variant_metadata_uvuj4mys5s"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_variant_capacity_variant_metadata_iylpytj5a3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."variant" AS "r1" WHERE "r1"."id" = OLD."variant" LOOP
    PERFORM 1 FROM "qti"."variant_metadata" AS "r1" WHERE "r1"."variant" = "t"."c1" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __variant_capacity_variant_metadata_jbonqirrvc violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__variant_capacity_variant_metadata_jbonqirrvc'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Variant",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Variant"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_variant_capacity_variant_metadata_iylpytj5a3"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_variant_capacity_variant_metadata_rjj32aacdc"
  AFTER INSERT ON "qti"."variant"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variant_capacity_variant_metadata_uvuj4mys5s"();

CREATE CONSTRAINT TRIGGER "__law_variant_capacity_variant_metadata_cvernxydyo"
  AFTER DELETE ON "qti"."variant_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_variant_capacity_variant_metadata_iylpytj5a3"();

-- The full violation query of law __variant_capacity_variant_metadata_jbonqirrvc.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c45" AS "id" FROM (SELECT "r13"."c23" FROM (SELECT DISTINCT "r12"."c21" FROM (SELECT DISTINCT "r11"."c19", "r11"."c20" FROM (SELECT DISTINCT "r4"."c8", "r10"."c18" FROM (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."identifierref", "r1"."package", "r1"."resource", "r1"."resource_identifier" FROM "qti"."variant" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")) AS "r4"("c8"), (SELECT DISTINCT "r9"."c15", "r9"."c16" FROM (SELECT "r8"."c14", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c11", "r7"."c12" FROM (SELECT DISTINCT "r6"."c9", "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."variant" FROM "qti"."variant_metadata" AS "r5") AS "r6"("c9", "c10")) AS "r7"("c11", "c12")) AS "r8"("c13", "c14") GROUP BY "r8"."c14") AS "r9"("c15", "c16")) AS "r10"("c17", "c18") WHERE "r4"."c8" = "r10"."c17") AS "r11"("c19", "c20") WHERE "r11"."c20" < 1::bigint OR "r11"."c20" > 1::bigint) AS "r12"("c21", "c22")) AS "r13"("c23") UNION SELECT "r26"."c44" FROM (SELECT DISTINCT "r25"."c43" FROM (SELECT DISTINCT "r24"."c42" FROM (SELECT DISTINCT "r17"."c31" FROM (SELECT DISTINCT "r16"."c30" FROM (SELECT DISTINCT "r15"."c24" FROM (SELECT DISTINCT "r14"."id", "r14"."identifier", "r14"."identifierref", "r14"."package", "r14"."resource", "r14"."resource_identifier" FROM "qti"."variant" AS "r14") AS "r15"("c24", "c25", "c26", "c27", "c28", "c29")) AS "r16"("c30")) AS "r17"("c31") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c38", "r22"."c39" FROM (SELECT "r21"."c37", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r20"."c34", "r20"."c35" FROM (SELECT DISTINCT "r19"."c32", "r19"."c33" FROM (SELECT DISTINCT "r18"."id", "r18"."variant" FROM "qti"."variant_metadata" AS "r18") AS "r19"("c32", "c33")) AS "r20"("c34", "c35")) AS "r21"("c36", "c37") GROUP BY "r21"."c37") AS "r22"("c38", "c39")) AS "r23"("c40", "c41") WHERE "r23"."c40" = "r17"."c31")) AS "r24"("c42") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c43")) AS "r26"("c44")) AS "r27"("c45")) THEN
    RAISE EXCEPTION 'law __variant_capacity_variant_metadata_jbonqirrvc is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__variant_capacity_variant_metadata_jbonqirrvc'::"pg_catalog"."text";
  END IF;
END
$$;
