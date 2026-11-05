-- Validate law __document_root_test_capacity_document_identifier_cjd23pr56p: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."document", "qti"."document_identifier" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_test_capacity_document_photb3xe7p"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = 'test'::"qti"."root_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."document_identifier" AS "r1" WHERE "r1"."document" = "t"."c1" GROUP BY "r1"."document") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."document_identifier" AS "r3" WHERE "r3"."document" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __document_root_test_capacity_document_identifier_cjd23pr56p violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_root_test_capacity_document_identifier_cjd23pr56p'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_test_capacity_document_photb3xe7p"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_test_capacity_document_3yiaumhtu2"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = OLD."document" LOOP
    IF "t"."c2" = 'test'::"qti"."root_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."document_identifier" AS "r1" WHERE "r1"."document" = "t"."c1" GROUP BY "r1"."document") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."document_identifier" AS "r3" WHERE "r3"."document" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __document_root_test_capacity_document_identifier_cjd23pr56p violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_root_test_capacity_document_identifier_cjd23pr56p'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_test_capacity_document_3yiaumhtu2"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_document_root_test_capacity_document_e37qcqe7ip"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."root" AS "c2" FROM "qti"."document" AS "r1" WHERE "r1"."id" = NEW."document" LOOP
    IF "t"."c2" = 'test'::"qti"."root_kind" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."document_identifier" AS "r1" WHERE "r1"."document" = "t"."c1" GROUP BY "r1"."document") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."document_identifier" AS "r3" WHERE "r3"."document" = "t"."c1") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __document_root_test_capacity_document_identifier_cjd23pr56p violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__document_root_test_capacity_document_identifier_cjd23pr56p'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Document",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Document"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_document_root_test_capacity_document_e37qcqe7ip"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_document_root_test_capacity_document_jx6wtdk7ev"
  AFTER INSERT ON "qti"."document"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."root" = 'test'::"qti"."root_kind")
  EXECUTE FUNCTION "qti"."__law_document_root_test_capacity_document_photb3xe7p"();

CREATE CONSTRAINT TRIGGER "__law_document_root_test_capacity_document_pxugmbqsv3"
  AFTER DELETE ON "qti"."document_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_root_test_capacity_document_3yiaumhtu2"();

CREATE CONSTRAINT TRIGGER "__law_document_root_test_capacity_document_damfeaga34"
  AFTER INSERT ON "qti"."document_identifier"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_document_root_test_capacity_document_e37qcqe7ip"();

-- The full violation query of law __document_root_test_capacity_document_identifier_cjd23pr56p.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c43" AS "id" FROM (WITH "r4"("c9") AS MATERIALIZED (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."package", "r1"."path", "r1"."resource", "r1"."resource_type", "r1"."root", "r1"."version" FROM "qti"."document" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c6" = 'test'::"qti"."root_kind") AS "r3"("c8")), "r12"("c28", "c29") AS MATERIALIZED (SELECT DISTINCT "r11"."c26", "r11"."c27" FROM (SELECT "r10"."c21", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c16", "r9"."c17", "r9"."c18", "r9"."c19", "r9"."c20" FROM (SELECT DISTINCT "r8"."c11", "r8"."c12", "r8"."c13", "r8"."c14", "r8"."c15" FROM (SELECT DISTINCT "r7"."document", "r7"."package", "r7"."resource", "r7"."root", "r7"."value" FROM "qti"."document_identifier" AS "r7") AS "r8"("c11", "c12", "c13", "c14", "c15")) AS "r9"("c16", "c17", "c18", "c19", "c20")) AS "r10"("c21", "c22", "c23", "c24", "c25") GROUP BY "r10"."c21") AS "r11"("c26", "c27")) SELECT "r17"."c36" FROM (SELECT DISTINCT "r16"."c34" FROM (SELECT DISTINCT "r15"."c32", "r15"."c33" FROM (SELECT DISTINCT "r6"."c10", "r14"."c31" FROM (SELECT "r5"."c9" FROM "r4" AS "r5") AS "r6"("c10"), (SELECT "r13"."c28", "r13"."c29" FROM "r12" AS "r13") AS "r14"("c30", "c31") WHERE "r6"."c10" = "r14"."c30") AS "r15"("c32", "c33") WHERE "r15"."c33" < 1::bigint OR "r15"."c33" > 1::bigint) AS "r16"("c34", "c35")) AS "r17"("c36") UNION SELECT "r24"."c42" FROM (SELECT DISTINCT "r23"."c41" FROM (SELECT DISTINCT "r22"."c40" FROM (SELECT DISTINCT "r19"."c37" FROM (SELECT "r18"."c9" FROM "r4" AS "r18") AS "r19"("c37") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c28", "r20"."c29" FROM "r12" AS "r20") AS "r21"("c38", "c39") WHERE "r21"."c38" = "r19"."c37")) AS "r22"("c40") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c41")) AS "r24"("c42")) AS "r25"("c43")) THEN
    RAISE EXCEPTION 'law __document_root_test_capacity_document_identifier_cjd23pr56p is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__document_root_test_capacity_document_identifier_cjd23pr56p'::"pg_catalog"."text";
  END IF;
END
$$;
