-- Validate law __node_kind_qti_random_float_in_random_float_fehk5zgx2s: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."node", "qti"."random_float" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_qti_random_float_in_random_float_sk2i3q4tz6"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'qti-random-float'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."random_float" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_qti_random_float_in_random_float_fehk5zgx2s violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_qti_random_float_in_random_float_fehk5zgx2s'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_qti_random_float_in_random_float_sk2i3q4tz6"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_qti_random_float_in_random_float_7v6uczstyj"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'qti-random-float'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."random_float" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_qti_random_float_in_random_float_fehk5zgx2s violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_qti_random_float_in_random_float_fehk5zgx2s'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_qti_random_float_in_random_float_7v6uczstyj"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_random_float_in_random_float_z6fs2bnfud"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'qti-random-float'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_node_kind_qti_random_float_in_random_float_sk2i3q4tz6"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_random_float_in_random_float_2l7rofqph3"
  AFTER DELETE ON "qti"."random_float"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_qti_random_float_in_random_float_7v6uczstyj"();

-- The full violation query of law __node_kind_qti_random_float_in_random_float_fehk5zgx2s.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c14" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'qti-random-float'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c12" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."max" FROM "qti"."random_float" AS "r5") AS "r6"("c10", "c11")) AS "r7"("c12")) AS "r8"("c13") WHERE "r8"."c13" = "r4"."c9")) AS "r9"("c14")) THEN
    RAISE EXCEPTION 'law __node_kind_qti_random_float_in_random_float_fehk5zgx2s is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_kind_qti_random_float_in_random_float_fehk5zgx2s'::"pg_catalog"."text";
  END IF;
END
$$;
