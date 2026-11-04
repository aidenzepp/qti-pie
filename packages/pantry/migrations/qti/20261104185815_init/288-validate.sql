-- Validate law __node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."lom_identifier_catalog", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_lom_catalog_in_lom_identifier_mzy6j7pekd"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
    IF "p"."c2" = 'lom:catalog'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."lom_identifier_catalog" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_lom_catalog_in_lom_identifier_mzy6j7pekd"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_lom_catalog_in_lom_identifier_fj45727ivi"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" "pg_catalog"."record";
BEGIN
  FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    IF "p"."c2" = 'lom:catalog'::"qti"."node_kind" THEN
      PERFORM 1 FROM "qti"."lom_identifier_catalog" AS "r1" WHERE "r1"."id" = "p"."c1";
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Node",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("p"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Node"]'::"pg_catalog"."text" END;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_lom_catalog_in_lom_identifier_fj45727ivi"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_lom_catalog_in_lom_identifier_b55ulry6e3"
  AFTER DELETE ON "qti"."lom_identifier_catalog"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_lom_catalog_in_lom_identifier_mzy6j7pekd"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_lom_catalog_in_lom_identifier_4kww5kn5nl"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."kind" = 'lom:catalog'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_node_kind_lom_catalog_in_lom_identifier_fj45727ivi"();

-- The full violation query of law __node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c19" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'lom:catalog'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c17" FROM (SELECT DISTINCT "r6"."c11" FROM (SELECT DISTINCT "r5"."collapsed", "r5"."id", "r5"."identifier", "r5"."lom", "r5"."owner", "r5"."position", "r5"."value" FROM "qti"."lom_identifier_catalog" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14", "c15", "c16")) AS "r7"("c17")) AS "r8"("c18") WHERE "r8"."c18" = "r4"."c9")) AS "r9"("c19")) THEN
    RAISE EXCEPTION 'law __node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__node_kind_lom_catalog_in_lom_identifier_catalog_sld5zvymje'::"pg_catalog"."text";
  END IF;
END
$$;
