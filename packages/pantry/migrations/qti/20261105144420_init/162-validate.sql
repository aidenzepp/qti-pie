-- Validate law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."modal_feedback" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_ylel34n5ls"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."modal_feedback" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
    IF "t"."c2" = '3.0.1'::"qti"."schema_version" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ModalFeedback",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ModalFeedback"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_ylel34n5ls"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_zwl3tubglm"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."modal_feedback" AS "r1" WHERE "r1"."id" = NEW."parent" LOOP
    IF "t"."c2" = '3.0.1'::"qti"."schema_version" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ModalFeedback",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ModalFeedback"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_zwl3tubglm"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_7dwbw72hqf"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."modal_feedback" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "t"."c2" = '3.0.1'::"qti"."schema_version" THEN
      FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind") LOOP
        IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
          RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 violated'
            USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                  CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::"pg_catalog"."text",
                  DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["ModalFeedback",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["ModalFeedback"]'::"pg_catalog"."text" END;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_7dwbw72hqf"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_modal_feedback_version_3_0_1_capacity_edge_6msa3ol7kk"
  AFTER DELETE ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (OLD."child_kind" = 'qti-content-body.modal'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_ylel34n5ls"();

CREATE CONSTRAINT TRIGGER "__law_modal_feedback_version_3_0_1_capacity_edge_lrmgqal6tq"
  AFTER INSERT ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."child_kind" = 'qti-content-body.modal'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_zwl3tubglm"();

CREATE CONSTRAINT TRIGGER "__law_modal_feedback_version_3_0_1_capacity_edge_ffdyudpxo2"
  AFTER INSERT ON "qti"."modal_feedback"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."version" = '3.0.1'::"qti"."schema_version")
  EXECUTE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_7dwbw72hqf"();

-- The full violation query of law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c53" AS "id" FROM (WITH "r4"("c7") AS MATERIALIZED (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide", "r1"."version" FROM "qti"."modal_feedback" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = '3.0.1'::"qti"."schema_version") AS "r3"("c6")), "r12"("c38", "c39") AS MATERIALIZED (SELECT DISTINCT "r11"."c36", "r11"."c37" FROM (SELECT "r10"."c30", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c18", "r9"."c19", "r9"."c20", "r9"."c21", "r9"."c22", "r9"."c23", "r9"."c24", "r9"."c25", "r9"."c26" FROM (SELECT DISTINCT "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13", "r8"."c14", "r8"."c15", "r8"."c16", "r8"."c17" FROM (SELECT DISTINCT "r7"."child", "r7"."child_ancestry", "r7"."child_kind", "r7"."parent", "r7"."parent_ancestry", "r7"."parent_kind", "r7"."position", "r7"."tree", "r7"."version" FROM "qti"."edge" AS "r7") AS "r8"("c9", "c10", "c11", "c12", "c13", "c14", "c15", "c16", "c17") WHERE "r8"."c11" = 'qti-content-body.modal'::"qti"."node_kind") AS "r9"("c18", "c19", "c20", "c21", "c22", "c23", "c24", "c25", "c26")) AS "r10"("c27", "c28", "c29", "c30", "c31", "c32", "c33", "c34", "c35") GROUP BY "r10"."c30") AS "r11"("c36", "c37")) SELECT "r17"."c46" FROM (SELECT DISTINCT "r16"."c44" FROM (SELECT DISTINCT "r15"."c42", "r15"."c43" FROM (SELECT DISTINCT "r6"."c8", "r14"."c41" FROM (SELECT "r5"."c7" FROM "r4" AS "r5") AS "r6"("c8"), (SELECT "r13"."c38", "r13"."c39" FROM "r12" AS "r13") AS "r14"("c40", "c41") WHERE "r6"."c8" = "r14"."c40") AS "r15"("c42", "c43") WHERE "r15"."c43" < 1::bigint OR "r15"."c43" > 1::bigint) AS "r16"("c44", "c45")) AS "r17"("c46") UNION SELECT "r24"."c52" FROM (SELECT DISTINCT "r23"."c51" FROM (SELECT DISTINCT "r22"."c50" FROM (SELECT DISTINCT "r19"."c47" FROM (SELECT "r18"."c7" FROM "r4" AS "r18") AS "r19"("c47") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c38", "r20"."c39" FROM "r12" AS "r20") AS "r21"("c48", "c49") WHERE "r21"."c48" = "r19"."c47")) AS "r22"("c50") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c51")) AS "r24"("c52")) AS "r25"("c53")) THEN
    RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::"pg_catalog"."text";
  END IF;
END
$$;
