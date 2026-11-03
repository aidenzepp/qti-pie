-- Validate law __node_kind_bdo_capacity_node_dir_rloxzsrimj: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."node", "qti"."node_dir" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_qrh2rbgjov"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
  "g" record;
BEGIN
  IF TG_TABLE_NAME = 'node'::text THEN
    IF NEW."kind" = 'bdo'::"qti"."node_kind" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
        IF "t"."c2" = 'bdo'::"qti"."node_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."node_dir" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_dir" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  ELSE
    IF TG_OP = 'INSERT'::text THEN
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = NEW."node" LOOP
        IF "t"."c2" = 'bdo'::"qti"."node_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."node_dir" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_dir" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    ELSE
      FOR "t" IN SELECT "r1"."id" AS "c1", "r1"."kind" AS "c2" FROM "qti"."node" AS "r1" WHERE "r1"."id" = OLD."node" LOOP
        IF "t"."c2" = 'bdo'::"qti"."node_kind" THEN
          FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT count(*) AS "c1" FROM "qti"."node_dir" AS "r1" WHERE "r1"."node" = "t"."c1" GROUP BY "r1"."node") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."node_dir" AS "r3" WHERE "r3"."node" = "t"."c1") LOOP
            IF "g"."c1" < 1::bigint OR "g"."c1" > 1::bigint THEN
              RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj violated'
                USING ERRCODE = 'integrity_constraint_violation'::text,
                      CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::text,
                      DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Node",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Node"]'::text END;
            END IF;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE'::text THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_qrh2rbgjov"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_node_kind_bdo_capacity_node_dir_drjgeb2eks"
  AFTER INSERT ON "qti"."node"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_qrh2rbgjov"();

CREATE CONSTRAINT TRIGGER "__law_node_kind_bdo_capacity_node_dir_sakugwp3yi"
  AFTER INSERT OR DELETE ON "qti"."node_dir"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_node_kind_bdo_capacity_node_dir_qrh2rbgjov"();

-- The full violation query of law __node_kind_bdo_capacity_node_dir_rloxzsrimj.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c59" AS "id" FROM (SELECT "r13"."c30" FROM (SELECT DISTINCT "r12"."c28" FROM (SELECT DISTINCT "r11"."c26", "r11"."c27" FROM (SELECT DISTINCT "r4"."c9", "r10"."c25" FROM (SELECT DISTINCT "r3"."c8" FROM (SELECT DISTINCT "r2"."c2" FROM (SELECT DISTINCT "r1"."ancestry", "r1"."id", "r1"."kind", "r1"."prefix", "r1"."root_kind", "r1"."tree", "r1"."version" FROM "qti"."node" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6", "c7") WHERE "r2"."c3" = 'bdo'::"qti"."node_kind") AS "r3"("c8")) AS "r4"("c9"), (SELECT DISTINCT "r9"."c22", "r9"."c23" FROM (SELECT "r8"."c20", count(*) FROM (SELECT DISTINCT "r7"."c14", "r7"."c15", "r7"."c16", "r7"."c17" FROM (SELECT DISTINCT "r6"."c10", "r6"."c11", "r6"."c12", "r6"."c13" FROM (SELECT DISTINCT "r5"."attribute", "r5"."kind", "r5"."node", "r5"."value" FROM "qti"."node_dir" AS "r5") AS "r6"("c10", "c11", "c12", "c13")) AS "r7"("c14", "c15", "c16", "c17")) AS "r8"("c18", "c19", "c20", "c21") GROUP BY "r8"."c20") AS "r9"("c22", "c23")) AS "r10"("c24", "c25") WHERE "r4"."c9" = "r10"."c24") AS "r11"("c26", "c27") WHERE "r11"."c27" < 1::bigint OR "r11"."c27" > 1::bigint) AS "r12"("c28", "c29")) AS "r13"("c30") UNION SELECT "r26"."c58" FROM (SELECT DISTINCT "r25"."c57" FROM (SELECT DISTINCT "r24"."c56" FROM (SELECT DISTINCT "r17"."c39" FROM (SELECT DISTINCT "r16"."c38" FROM (SELECT DISTINCT "r15"."c32" FROM (SELECT DISTINCT "r14"."ancestry", "r14"."id", "r14"."kind", "r14"."prefix", "r14"."root_kind", "r14"."tree", "r14"."version" FROM "qti"."node" AS "r14") AS "r15"("c31", "c32", "c33", "c34", "c35", "c36", "c37") WHERE "r15"."c33" = 'bdo'::"qti"."node_kind") AS "r16"("c38")) AS "r17"("c39") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c52", "r22"."c53" FROM (SELECT "r21"."c50", count(*) FROM (SELECT DISTINCT "r20"."c44", "r20"."c45", "r20"."c46", "r20"."c47" FROM (SELECT DISTINCT "r19"."c40", "r19"."c41", "r19"."c42", "r19"."c43" FROM (SELECT DISTINCT "r18"."attribute", "r18"."kind", "r18"."node", "r18"."value" FROM "qti"."node_dir" AS "r18") AS "r19"("c40", "c41", "c42", "c43")) AS "r20"("c44", "c45", "c46", "c47")) AS "r21"("c48", "c49", "c50", "c51") GROUP BY "r21"."c50") AS "r22"("c52", "c53")) AS "r23"("c54", "c55") WHERE "r23"."c54" = "r17"."c39")) AS "r24"("c56") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r25"("c57")) AS "r26"("c58")) AS "r27"("c59")) THEN
    RAISE EXCEPTION 'law __node_kind_bdo_capacity_node_dir_rloxzsrimj is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__node_kind_bdo_capacity_node_dir_rloxzsrimj'::text;
  END IF;
END
$$;
