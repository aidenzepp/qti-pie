-- Validate law __stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."html_id", "qti"."stimulus_body" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_gqtmow3sqf"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."stimulus_body" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = '3.0.0'::"qti"."schema_version" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."html_id" AS "r1" WHERE "r1"."node" = "t"."c1" AND "r1"."kind" = 'qti-stimulus-body'::"qti"."node_kind" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."html_id" AS "r3" WHERE "r3"."node" = "t"."c1" AND "r3"."kind" = 'qti-stimulus-body'::"qti"."node_kind") LOOP
        IF "g"."c1" > 0::bigint THEN
          RAISE EXCEPTION 'law __stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["StimulusBody",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["StimulusBody"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_gqtmow3sqf"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_ol2udjfo3x"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."stimulus_body" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = '3.0.0'::"qti"."schema_version" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."html_id" AS "r1" WHERE "r1"."node" = "t"."c1" AND "r1"."kind" = 'qti-stimulus-body'::"qti"."node_kind" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."html_id" AS "r3" WHERE "r3"."node" = "t"."c1" AND "r3"."kind" = 'qti-stimulus-body'::"qti"."node_kind") LOOP
        IF "g"."c1" > 0::bigint THEN
          RAISE EXCEPTION 'law __stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["StimulusBody",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["StimulusBody"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_ol2udjfo3x"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_stimulus_body_version_3_0_0_capacity_html_id_gzgf73euob"
  AFTER INSERT ON "qti"."html_id"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'qti-stimulus-body'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_gqtmow3sqf"();

CREATE CONSTRAINT TRIGGER "__law_stimulus_body_version_3_0_0_capacity_html_id_ab7f5ifzr4"
  AFTER INSERT ON "qti"."stimulus_body"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."version" = '3.0.0'::"qti"."schema_version")
  EXECUTE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_html_id_ol2udjfo3x"();

-- The full violation query of law __stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c28" AS "id" FROM (SELECT DISTINCT "r12"."c26" FROM (SELECT DISTINCT "r11"."c24", "r11"."c25" FROM (SELECT DISTINCT "r4"."c4", "r10"."c23" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."version" FROM "qti"."stimulus_body" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c2" = '3.0.0'::"qti"."schema_version") AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c20", "r9"."c21" FROM (SELECT "r8"."c19", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c10", "r7"."c11", "r7"."c12", "r7"."c13", "r7"."c14" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6", "r6"."c7", "r6"."c8", "r6"."c9" FROM (SELECT DISTINCT "r5"."attribute", "r5"."document", "r5"."id", "r5"."kind", "r5"."node" FROM "qti"."html_id" AS "r5") AS "r6"("c5", "c6", "c7", "c8", "c9") WHERE "r6"."c8" = 'qti-stimulus-body'::"qti"."node_kind") AS "r7"("c10", "c11", "c12", "c13", "c14")) AS "r8"("c15", "c16", "c17", "c18", "c19") GROUP BY "r8"."c19") AS "r9"("c20", "c21")) AS "r10"("c22", "c23") WHERE "r4"."c4" = "r10"."c22") AS "r11"("c24", "c25") WHERE "r11"."c25" < 0::bigint OR "r11"."c25" > 0::bigint) AS "r12"("c26", "c27")) AS "r13"("c28")) THEN
    RAISE EXCEPTION 'law __stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__stimulus_body_version_3_0_0_capacity_html_id_aknm3nkvwa'::"pg_catalog"."text";
  END IF;
END
$$;
