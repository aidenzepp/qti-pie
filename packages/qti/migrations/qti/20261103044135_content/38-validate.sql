-- Validate law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."modal_feedback" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_u3afzdnvc2"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'modal_feedback'::text THEN
    IF NEW."version" = '3.0.1'::"qti"."schema_version" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."modal_feedback" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = '3.0.1'::"qti"."schema_version" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ModalFeedback",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ModalFeedback"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      IF NEW."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" THEN
        FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."modal_feedback" AS "r1" WHERE "r1"."id" = NEW."parent" LOOP
          IF "t"."c2" = '3.0.1'::"qti"."schema_version" THEN
            FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind") LOOP
              IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
                RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 violated'
                  USING ERRCODE = 'integrity_constraint_violation'::text,
                        CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::text,
                        DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ModalFeedback",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ModalFeedback"]'::text END;
              END IF;
            END LOOP;
          END IF;
        END LOOP;
      END IF;
    ELSE
      IF OLD."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" THEN
        FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."version" AS "c2" FROM "qti"."modal_feedback" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
          IF "t"."c2" = '3.0.1'::"qti"."schema_version" THEN
            FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-content-body.modal'::"qti"."node_kind") LOOP
              IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
                RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 violated'
                  USING ERRCODE = 'integrity_constraint_violation'::text,
                        CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::text,
                        DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["ModalFeedback",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["ModalFeedback"]'::text END;
              END IF;
            END LOOP;
          END IF;
        END LOOP;
      END IF;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_u3afzdnvc2"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_modal_feedback_version_3_0_1_capacity_edge_xl53nsq367"
  AFTER INSERT OR DELETE ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_u3afzdnvc2"();

CREATE CONSTRAINT TRIGGER "__law_modal_feedback_version_3_0_1_capacity_edge_7zcwodwa4i"
  AFTER INSERT ON "qti"."modal_feedback"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_modal_feedback_version_3_0_1_capacity_edge_u3afzdnvc2"();

-- The full violation query of law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c85" AS "id" FROM (SELECT "r13"."c43" FROM (SELECT DISTINCT "r12"."c41" FROM (SELECT DISTINCT "r11"."c39", "r11"."c40" FROM (SELECT DISTINCT "r4"."c7", "r10"."c38" FROM (SELECT DISTINCT "r3"."c6" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."identifier", "r1"."outcome_identifier", "r1"."show_hide", "r1"."version" FROM "qti"."modal_feedback" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5") WHERE "r2"."c5" = '3.0.1'::"qti"."schema_version") AS "r3"("c6")) AS "r4"("c7"), (SELECT DISTINCT "r9"."c35", "r9"."c36" FROM (SELECT "r8"."c29", count(*) FROM (SELECT DISTINCT "r7"."c17", "r7"."c18", "r7"."c19", "r7"."c20", "r7"."c21", "r7"."c22", "r7"."c23", "r7"."c24", "r7"."c25" FROM (SELECT DISTINCT "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13", "r6"."c14", "r6"."c15", "r6"."c16" FROM (SELECT DISTINCT "r5"."child", "r5"."child_ancestry", "r5"."child_kind", "r5"."parent", "r5"."parent_ancestry", "r5"."parent_kind", "r5"."position", "r5"."tree", "r5"."version" FROM "qti"."edge" AS "r5") AS "r6"("c8", "c9", "c10", "c11", "c12", "c13", "c14", "c15", "c16") WHERE "r6"."c10" = 'qti-content-body.modal'::"qti"."node_kind") AS "r7"("c17", "c18", "c19", "c20", "c21", "c22", "c23", "c24", "c25")) AS "r8"("c26", "c27", "c28", "c29", "c30", "c31", "c32", "c33", "c34") GROUP BY "r8"."c29") AS "r9"("c35", "c36")) AS "r10"("c37", "c38") WHERE "r4"."c7" = "r10"."c37") AS "r11"("c39", "c40") WHERE "r11"."c40" < 1::bigint OR "r11"."c40" > 1::bigint) AS "r12"("c41", "c42")) AS "r13"("c43") UNION SELECT "r26"."c84" FROM (SELECT DISTINCT "r25"."c83" FROM (SELECT DISTINCT "r24"."c82" FROM (SELECT DISTINCT "r17"."c50" FROM (SELECT DISTINCT "r16"."c49" FROM (SELECT DISTINCT "r15"."c44" FROM (SELECT DISTINCT "r14"."id", "r14"."identifier", "r14"."outcome_identifier", "r14"."show_hide", "r14"."version" FROM "qti"."modal_feedback" AS "r14") AS "r15"("c44", "c45", "c46", "c47", "c48") WHERE "r15"."c48" = '3.0.1'::"qti"."schema_version") AS "r16"("c49")) AS "r17"("c50") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c78", "r22"."c79" FROM (SELECT "r21"."c72", count(*) FROM (SELECT DISTINCT "r20"."c60", "r20"."c61", "r20"."c62", "r20"."c63", "r20"."c64", "r20"."c65", "r20"."c66", "r20"."c67", "r20"."c68" FROM (SELECT DISTINCT "r19"."c51", "r19"."c52", "r19"."c53", "r19"."c54", "r19"."c55", "r19"."c56", "r19"."c57", "r19"."c58", "r19"."c59" FROM (SELECT DISTINCT "r18"."child", "r18"."child_ancestry", "r18"."child_kind", "r18"."parent", "r18"."parent_ancestry", "r18"."parent_kind", "r18"."position", "r18"."tree", "r18"."version" FROM "qti"."edge" AS "r18") AS "r19"("c51", "c52", "c53", "c54", "c55", "c56", "c57", "c58", "c59") WHERE "r19"."c53" = 'qti-content-body.modal'::"qti"."node_kind") AS "r20"("c60", "c61", "c62", "c63", "c64", "c65", "c66", "c67", "c68")) AS "r21"("c69", "c70", "c71", "c72", "c73", "c74", "c75", "c76", "c77") GROUP BY "r21"."c72") AS "r22"("c78", "c79")) AS "r23"("c80", "c81") WHERE "r23"."c80" = "r17"."c50")) AS "r24"("c82") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c83")) AS "r26"("c84")) AS "r27"("c85")) THEN
    RAISE EXCEPTION 'law __modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7 is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__modal_feedback_version_3_0_1_capacity_edge_37y3yt64p7'::text;
  END IF;
END
$$;
