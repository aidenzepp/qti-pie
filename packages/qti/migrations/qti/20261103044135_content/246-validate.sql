-- Validate law __node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."area_map_entry", "qti"."node" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_qti_area_map_entry_in_area_map_entry_yrlv4x4anb"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "p" record;
BEGIN
  IF TG_TABLE_NAME = 'node'::text THEN
    IF NEW."kind" = 'qti-area-map-entry'::"qti"."node_kind" THEN
      FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "p"."c2" = 'qti-area-map-entry'::"qti"."node_kind" THEN
          PERFORM 1 FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = "p"."c1";
          IF NOT FOUND THEN
            RAISE EXCEPTION 'law __node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq violated'
              USING ERRCODE = 'integrity_constraint_violation'::text,
                    CONSTRAINT = '__node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq'::text,
                    DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
          END IF;
        END IF;
      END LOOP;
    END IF;
  ELSE
    FOR "p" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."id" LOOP
      IF "p"."c2" = 'qti-area-map-entry'::"qti"."node_kind" THEN
        PERFORM 1 FROM "qti"."area_map_entry" AS "r1" WHERE "r1"."id" = "p"."c1";
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("p"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
        END IF;
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_qti_area_map_entry_in_area_map_entry_yrlv4x4anb"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_area_map_entry_in_area_map_entry_3jv6j5zlns"
  AFTER DELETE ON "qti"."area_map_entry"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_qti_area_map_entry_in_area_map_entry_yrlv4x4anb"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_qti_area_map_entry_in_area_map_entry_sub73ee7z5"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_qti_area_map_entry_in_area_map_entry_yrlv4x4anb"();

-- The full violation query of law __node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq.
DO $$
BEGIN
  IF EXISTS (SELECT "r9"."c17" AS "id" FROM (SELECT DISTINCT "r4"."c9" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'qti-area-map-entry'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r7"."c15" FROM (SELECT DISTINCT "r6"."c11" FROM (SELECT DISTINCT "r5"."area_mapping", "r5"."id", "r5"."mapped_value", "r5"."position", "r5"."shape" FROM "qti"."area_map_entry" AS "r5") AS "r6"("c10", "c11", "c12", "c13", "c14")) AS "r7"("c15")) AS "r8"("c16") WHERE "r8"."c16" = "r4"."c9")) AS "r9"("c17")) THEN
    RAISE EXCEPTION 'law __node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__node_kind_qti_area_map_entry_in_area_map_entry_ujxormnlfq'::text;
  END IF;
END
$$;
