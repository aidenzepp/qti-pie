-- Validate law __document_root_usagedata_capacity_document_oiijyffs2z: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document", "qti"."document_identifier" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_usagedata_capacity_document_vgnvidtwzb"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'usagedata'::"qti"."root_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."document_identifier" AS "r1" WHERE "r1"."document" = "t"."c1" GROUP BY "r1"."document") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."document_identifier" AS "r3" WHERE "r3"."document" = "t"."c1") LOOP
        IF "g"."c1" > 0::bigint THEN
          RAISE EXCEPTION 'law __document_root_usagedata_capacity_document_oiijyffs2z violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_root_usagedata_capacity_document_oiijyffs2z'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_usagedata_capacity_document_vgnvidtwzb"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_usagedata_capacity_document_yzi75nhvkp"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = NEW."document" LOOP
    IF "t"."c2" = 'usagedata'::"qti"."root_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."document_identifier" AS "r1" WHERE "r1"."document" = "t"."c1" GROUP BY "r1"."document") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."document_identifier" AS "r3" WHERE "r3"."document" = "t"."c1") LOOP
        IF "g"."c1" > 0::bigint THEN
          RAISE EXCEPTION 'law __document_root_usagedata_capacity_document_oiijyffs2z violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_root_usagedata_capacity_document_oiijyffs2z'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_usagedata_capacity_document_yzi75nhvkp"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_root_usagedata_capacity_document_ijepqibwqd"
  AFTER INSERT ON "qti"."document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'usagedata'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_document_root_usagedata_capacity_document_vgnvidtwzb"();

CREATE CONSTRAINT TRIGGER "__law_document_root_usagedata_capacity_document_nvq7sajp4w"
  AFTER INSERT ON "qti"."document_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_root_usagedata_capacity_document_yzi75nhvkp"();

-- The full violation query of law __document_root_usagedata_capacity_document_oiijyffs2z.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c33" AS "id" FROM (SELECT DISTINCT "r12"."c31" FROM (SELECT DISTINCT "r11"."c29", "r11"."c30" FROM (SELECT DISTINCT "r4"."c9", "r10"."c28" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version" FROM "qti"."document" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'usagedata'::"qti"."root_kind") AS "r3"("c8")) AS "r4"("c9"), (SELECT DISTINCT "r9"."c25", "r9"."c26" FROM (SELECT "r8"."c20", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18", "r7"."c19" FROM (SELECT DISTINCT "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14" FROM (SELECT DISTINCT "r5"."document", "r5"."package", "r5"."resource", "r5"."root", "r5"."value" FROM "qti"."document_identifier" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14")) AS "r7"("c15", "c16", "c17", "c18", "c19")) AS "r8"("c20", "c21", "c22", "c23", "c24") GROUP BY "r8"."c20") AS "r9"("c25", "c26")) AS "r10"("c27", "c28") WHERE "r4"."c9" = "r10"."c27") AS "r11"("c29", "c30") WHERE "r11"."c30" < 0::bigint OR "r11"."c30" > 0::bigint) AS "r12"("c31", "c32")) AS "r13"("c33")) THEN
    RAISE EXCEPTION 'law __document_root_usagedata_capacity_document_oiijyffs2z is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__document_root_usagedata_capacity_document_oiijyffs2z'::"pg_catalog"."text";
  END IF;
END
$$;
