-- Validate law __qti_metadata_host_alternatives_irfejbxvik: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."qti_metadata", "qti"."qti_metadata_in_external_lom", "qti"."qti_metadata_in_metadata", "qti"."qti_metadata_in_resource_lom" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_qti_metadata_host_alternatives_zylpyp45q3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."host" AS "c2" FROM "qti"."qti_metadata" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    CASE "p"."c2"
      WHEN 'metadata'::"qti"."qti_metadata_host" THEN
        PERFORM 1 FROM "qti"."qti_metadata_in_metadata" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __qti_metadata_host_alternatives_irfejbxvik violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__qti_metadata_host_alternatives_irfejbxvik'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["QtiMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["QtiMetadata"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'resourceLom'::"qti"."qti_metadata_host" THEN
        PERFORM 1 FROM "qti"."qti_metadata_in_resource_lom" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __qti_metadata_host_alternatives_irfejbxvik violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__qti_metadata_host_alternatives_irfejbxvik'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["QtiMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["QtiMetadata"]'::"pg_catalog"."text" END;
        END IF;
      WHEN 'externalLom'::"qti"."qti_metadata_host" THEN
        PERFORM 1 FROM "qti"."qti_metadata_in_external_lom" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __qti_metadata_host_alternatives_irfejbxvik violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__qti_metadata_host_alternatives_irfejbxvik'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["QtiMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["QtiMetadata"]'::"pg_catalog"."text" END;
        END IF;
    END CASE;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_qti_metadata_host_alternatives_zylpyp45q3"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_qti_metadata_host_alternatives_teh6bgzzml"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."host" AS "c2" FROM "qti"."qti_metadata" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'externalLom'::"qti"."qti_metadata_host" THEN
      PERFORM 1 FROM "qti"."qti_metadata_in_external_lom" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __qti_metadata_host_alternatives_irfejbxvik violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__qti_metadata_host_alternatives_irfejbxvik'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["QtiMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["QtiMetadata"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_qti_metadata_host_alternatives_teh6bgzzml"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_qti_metadata_host_alternatives_msebrp4jyv"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."host" AS "c2" FROM "qti"."qti_metadata" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'metadata'::"qti"."qti_metadata_host" THEN
      PERFORM 1 FROM "qti"."qti_metadata_in_metadata" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __qti_metadata_host_alternatives_irfejbxvik violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__qti_metadata_host_alternatives_irfejbxvik'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["QtiMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["QtiMetadata"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_qti_metadata_host_alternatives_msebrp4jyv"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_qti_metadata_host_alternatives_dxl6agg4do"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."host" AS "c2" FROM "qti"."qti_metadata" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'resourceLom'::"qti"."qti_metadata_host" THEN
      PERFORM 1 FROM "qti"."qti_metadata_in_resource_lom" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __qti_metadata_host_alternatives_irfejbxvik violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__qti_metadata_host_alternatives_irfejbxvik'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["QtiMetadata",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["QtiMetadata"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_qti_metadata_host_alternatives_dxl6agg4do"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_qti_metadata_host_alternatives_6dbk45ki2t"
  AFTER INSERT ON "qti"."qti_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_qti_metadata_host_alternatives_zylpyp45q3"();

CREATE CONSTRAINT TRIGGER "__law_qti_metadata_host_alternatives_mvgr7th7cp"
  AFTER DELETE ON "qti"."qti_metadata_in_external_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_qti_metadata_host_alternatives_teh6bgzzml"();

CREATE CONSTRAINT TRIGGER "__law_qti_metadata_host_alternatives_4ekxmuvuim"
  AFTER DELETE ON "qti"."qti_metadata_in_metadata"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_qti_metadata_host_alternatives_msebrp4jyv"();

CREATE CONSTRAINT TRIGGER "__law_qti_metadata_host_alternatives_pnpgra32vm"
  AFTER DELETE ON "qti"."qti_metadata_in_resource_lom"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_qti_metadata_host_alternatives_dxl6agg4do"();

-- The full violation query of law __qti_metadata_host_alternatives_irfejbxvik.
DO $$
BEGIN
  IF EXISTS (SELECT "r28"."c41" AS "id" FROM (SELECT "r9"."c14" FROM (SELECT DISTINCT "r4"."c6" FROM (SELECT DISTINCT "r3"."c5" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."host", "r1"."id", "r1"."package", "r1"."resource" FROM "qti"."qti_metadata" AS "r1") AS "r2"("c1", "c2", "c3", "c4") WHERE "r2"."c1" = 'metadata'::"qti"."qti_metadata_host") AS "r3"("c5")) AS "r4"("c6") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c7" FROM (SELECT DISTINCT "r5"."id", "r5"."metadata", "r5"."package", "r5"."resource", "r5"."resource_node" FROM "qti"."qti_metadata_in_metadata" AS "r5") AS "r6"("c7", "c8", "c9", "c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c6")) AS "r9"("c14") UNION SELECT "r18"."c27" FROM (SELECT DISTINCT "r13"."c20" FROM (SELECT DISTINCT "r12"."c19" FROM (SELECT DISTINCT "r11"."c16" FROM (SELECT DISTINCT "r10"."host", "r10"."id", "r10"."package", "r10"."resource" FROM "qti"."qti_metadata" AS "r10") AS "r11"("c15", "c16", "c17", "c18") WHERE "r11"."c15" = 'resourceLom'::"qti"."qti_metadata_host") AS "r12"("c19")) AS "r13"("c20") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r16"."c25" FROM (SELECT DISTINCT "r15"."c21" FROM (SELECT DISTINCT "r14"."id", "r14"."lom", "r14"."package", "r14"."resource" FROM "qti"."qti_metadata_in_resource_lom" AS "r14") AS "r15"("c21", "c22", "c23", "c24")) AS "r16"("c25")) AS "r17"("c26") WHERE "r17"."c26" = "r13"."c20")) AS "r18"("c27") UNION SELECT "r27"."c40" FROM (SELECT DISTINCT "r22"."c33" FROM (SELECT DISTINCT "r21"."c32" FROM (SELECT DISTINCT "r20"."c29" FROM (SELECT DISTINCT "r19"."host", "r19"."id", "r19"."package", "r19"."resource" FROM "qti"."qti_metadata" AS "r19") AS "r20"("c28", "c29", "c30", "c31") WHERE "r20"."c28" = 'externalLom'::"qti"."qti_metadata_host") AS "r21"("c32")) AS "r22"("c33") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r25"."c38" FROM (SELECT DISTINCT "r24"."c34" FROM (SELECT DISTINCT "r23"."id", "r23"."lom", "r23"."package", "r23"."resource" FROM "qti"."qti_metadata_in_external_lom" AS "r23") AS "r24"("c34", "c35", "c36", "c37")) AS "r25"("c38")) AS "r26"("c39") WHERE "r26"."c39" = "r22"."c33")) AS "r27"("c40")) AS "r28"("c41")) THEN
    RAISE EXCEPTION 'law __qti_metadata_host_alternatives_irfejbxvik is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__qti_metadata_host_alternatives_irfejbxvik'::"pg_catalog"."text";
  END IF;
END
$$;
