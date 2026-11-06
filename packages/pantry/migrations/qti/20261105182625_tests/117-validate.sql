-- Validate law __stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."node_label", "qti"."stimulus_body" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_6kawmwufdj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."stimulus_body" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
    IF "t"."c2" = '3.0.0'::"qti"."schema_version" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."node_label" AS "r1" WHERE "r1"."node" = "t"."c1" AND "r1"."kind" = 'qti-stimulus-body'::"qti"."node_kind" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_label" AS "r3" WHERE "r3"."node" = "t"."c1" AND "r3"."kind" = 'qti-stimulus-body'::"qti"."node_kind") LOOP
        IF "g"."c1" > 0::bigint THEN
          RAISE EXCEPTION 'law __stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["StimulusBody",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["StimulusBody"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_6kawmwufdj"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_fj6xmtqh3z"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."stimulus_body" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = '3.0.0'::"qti"."schema_version" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."node_label" AS "r1" WHERE "r1"."node" = "t"."c1" AND "r1"."kind" = 'qti-stimulus-body'::"qti"."node_kind" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_label" AS "r3" WHERE "r3"."node" = "t"."c1" AND "r3"."kind" = 'qti-stimulus-body'::"qti"."node_kind") LOOP
        IF "g"."c1" > 0::bigint THEN
          RAISE EXCEPTION 'law __stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["StimulusBody",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["StimulusBody"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_fj6xmtqh3z"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_meg5g66blf"
  AFTER INSERT ON "qti"."node_label"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'qti-stimulus-body'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_6kawmwufdj"();

CREATE CONSTRAINT TRIGGER "__law_stimulus_body_version_3_0_0_capacity_node_v25t7nty35"
  AFTER INSERT ON "qti"."stimulus_body"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."version" = '3.0.0'::"qti"."schema_version")
  EXECUTE FUNCTION "qti"."__law_stimulus_body_version_3_0_0_capacity_node_fj6xmtqh3z"();

-- The full violation query of law __stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43.
DO $$
BEGIN
  IF EXISTS (SELECT "r13"."c31" AS "id" FROM (SELECT DISTINCT "r12"."c29" FROM (SELECT DISTINCT "r11"."c27", "r11"."c28" FROM (SELECT DISTINCT "r4"."c4", "r10"."c26" FROM (SELECT DISTINCT "r3"."c3" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."version" FROM "qti"."stimulus_body" AS "r1") AS "r2"("c1", "c2") WHERE "r2"."c2" = '3.0.0'::"qti"."schema_version") AS "r3"("c3")) AS "r4"("c4"), (SELECT DISTINCT "r9"."c23", "r9"."c24" FROM (SELECT "r8"."c19", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r7"."c11", "r7"."c12", "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16" FROM (SELECT DISTINCT "r6"."c5", "r6"."c6", "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10" FROM (SELECT DISTINCT "r5"."attribute", "r5"."kind", "r5"."node", "r5"."root_kind", "r5"."tree", "r5"."value" FROM "qti"."node_label" AS "r5") AS "r6"("c5", "c6", "c7", "c8", "c9", "c10") WHERE "r6"."c6" = 'qti-stimulus-body'::"qti"."node_kind") AS "r7"("c11", "c12", "c13", "c14", "c15", "c16")) AS "r8"("c17", "c18", "c19", "c20", "c21", "c22") GROUP BY "r8"."c19") AS "r9"("c23", "c24")) AS "r10"("c25", "c26") WHERE "r4"."c4" = "r10"."c25") AS "r11"("c27", "c28") WHERE "r11"."c28" < 0::bigint OR "r11"."c28" > 0::bigint) AS "r12"("c29", "c30")) AS "r13"("c31")) THEN
    RAISE EXCEPTION 'law __stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__stimulus_body_version_3_0_0_capacity_node_label_cwzwvp6p43'::"pg_catalog"."text";
  END IF;
END
$$;
