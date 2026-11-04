-- Validate law __node_kind_lom_requirement_in_lom_requirement_ammdgwbjts: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_requirement", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_lom_requirement_in_lom_requirement_iw34iddfy3"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'lom:requirement'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."lom_requirement" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_lom_requirement_in_lom_requirement_ammdgwbjts violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_lom_requirement_in_lom_requirement_ammdgwbjts'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_lom_requirement_in_lom_requirement_iw34iddfy3"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_lom_requirement_in_lom_requirement_6tort3lqkm"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'lom:requirement'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."lom_requirement" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_lom_requirement_in_lom_requirement_ammdgwbjts violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_lom_requirement_in_lom_requirement_ammdgwbjts'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_lom_requirement_in_lom_requirement_6tort3lqkm"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_lom_requirement_in_lom_requirement_jatxie7g5s"
  AFTER DELETE ON "qti"."lom_requirement"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_lom_requirement_in_lom_requirement_iw34iddfy3"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_lom_requirement_in_lom_requirement_6flf62ccz7"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'lom:requirement'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_node_kind_lom_requirement_in_lom_requirement_6tort3lqkm"();

-- The full violation query of law __node_kind_lom_requirement_in_lom_requirement_ammdgwbjts.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c16" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'lom:requirement'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c14" FROM (SELECT DISTINCT "r6"."c10" FROM (SELECT DISTINCT "r5"."id", "r5"."lom", "r5"."position", "r5"."technical" FROM "qti"."lom_requirement" AS "r5") AS "r6"("c10", "c11", "c12", "c13")) AS "r7"("c14")) AS "r8"("c15") WHERE "r8"."c15" = "r4"."c9")) AS "r9"("c16")) THEN
    RAISE EXCEPTION 'law __node_kind_lom_requirement_in_lom_requirement_ammdgwbjts is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_kind_lom_requirement_in_lom_requirement_ammdgwbjts'::"pg_catalog"."text";
  END IF;
END
$$;
