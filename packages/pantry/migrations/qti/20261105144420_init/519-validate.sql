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
  IF EXISTS (SELECT "r25"."c33" AS "id" FROM (WITH "r4"("c8") AS MATERIALIZED (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."identifierref", "r1"."package", "r1"."resource", "r1"."resource_identifier" FROM "qti"."variant" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")), "r12"("c18", "c19") AS MATERIALIZED (SELECT DISTINCT "r11"."c16", "r11"."c17" FROM (SELECT "r10"."c15", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c12", "r9"."c13" FROM (SELECT DISTINCT "r8"."c10", "r8"."c11" FROM (SELECT DISTINCT "r7"."id", "r7"."variant" FROM "qti"."variant_metadata" AS "r7") AS "r8"("c10", "c11")) AS "r9"("c12", "c13")) AS "r10"("c14", "c15") GROUP BY "r10"."c15") AS "r11"("c16", "c17")) SELECT "r17"."c26" FROM (SELECT DISTINCT "r16"."c24" FROM (SELECT DISTINCT "r15"."c22", "r15"."c23" FROM (SELECT DISTINCT "r6"."c9", "r14"."c21" FROM (SELECT "r5"."c8" FROM "r4" AS "r5") AS "r6"("c9"), (SELECT "r13"."c18", "r13"."c19" FROM "r12" AS "r13") AS "r14"("c20", "c21") WHERE "r6"."c9" = "r14"."c20") AS "r15"("c22", "c23") WHERE "r15"."c23" < 1::bigint OR "r15"."c23" > 1::bigint) AS "r16"("c24", "c25")) AS "r17"("c26") UNION SELECT "r24"."c32" FROM (SELECT DISTINCT "r23"."c31" FROM (SELECT DISTINCT "r22"."c30" FROM (SELECT DISTINCT "r19"."c27" FROM (SELECT "r18"."c8" FROM "r4" AS "r18") AS "r19"("c27") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c18", "r20"."c19" FROM "r12" AS "r20") AS "r21"("c28", "c29") WHERE "r21"."c28" = "r19"."c27")) AS "r22"("c30") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c31")) AS "r24"("c32")) AS "r25"("c33")) THEN
    RAISE EXCEPTION 'law __variant_capacity_variant_metadata_jbonqirrvc is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__variant_capacity_variant_metadata_jbonqirrvc'::"pg_catalog"."text";
  END IF;
END
$$;
