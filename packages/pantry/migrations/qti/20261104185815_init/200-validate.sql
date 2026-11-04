-- Validate law __node_kind_qti_gap_text_in_gap_text_uaxnsuab5d: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."gap_text", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_qti_gap_text_in_gap_text_k7v4isi3mt"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'qti-gap-text'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."gap_text" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_qti_gap_text_in_gap_text_uaxnsuab5d violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_qti_gap_text_in_gap_text_uaxnsuab5d'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_qti_gap_text_in_gap_text_k7v4isi3mt"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_qti_gap_text_in_gap_text_jocwt6jrcz"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'qti-gap-text'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."gap_text" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_qti_gap_text_in_gap_text_uaxnsuab5d violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_qti_gap_text_in_gap_text_uaxnsuab5d'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_qti_gap_text_in_gap_text_jocwt6jrcz"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_gap_text_in_gap_text_cnshoald7e"
  AFTER DELETE ON "qti"."gap_text"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_qti_gap_text_in_gap_text_k7v4isi3mt"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_gap_text_in_gap_text_apg7jbr2ls"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'qti-gap-text'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_node_kind_qti_gap_text_in_gap_text_jocwt6jrcz"();

-- The full violation query of law __node_kind_qti_gap_text_in_gap_text_uaxnsuab5d.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c18" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'qti-gap-text'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c16" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."identifier", "r5"."interaction", "r5"."match_max_n", "r5"."match_min_n", "r5"."show_hide" FROM "qti"."gap_text" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14", "c15")) AS "r7"("c16")) AS "r8"("c17") WHERE "r8"."c17" = "r4"."c9")) AS "r9"("c18")) THEN
    RAISE EXCEPTION 'law __node_kind_qti_gap_text_in_gap_text_uaxnsuab5d is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_kind_qti_gap_text_in_gap_text_uaxnsuab5d'::"pg_catalog"."text";
  END IF;
END
$$;
