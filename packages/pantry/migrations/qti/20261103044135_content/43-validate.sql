-- Validate law __picture_capacity_edge_jg6htmccrw: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."picture" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_picture_capacity_edge_kltcsqbzjl"() RETURNS trigger
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" record;
BEGIN
  IF TG_TABLE_NAME = 'picture'::text THEN
    FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."picture" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
      PERFORM 1 FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'source'::"qti"."node_kind" LIMIT 1;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'law __picture_capacity_edge_jg6htmccrw violated'
          USING ERRCODE = 'integrity_constraint_violation'::text,
                CONSTRAINT = '__picture_capacity_edge_jg6htmccrw'::text,
                DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Picture",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Picture"]'::text END;
      END IF;
    END LOOP;
  ELSE
    IF OLD."child_kind" = 'source'::"qti"."node_kind" THEN
      FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."picture" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
        PERFORM 1 FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'source'::"qti"."node_kind" LIMIT 1;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'law __picture_capacity_edge_jg6htmccrw violated'
            USING ERRCODE = 'integrity_constraint_violation'::text,
                  CONSTRAINT = '__picture_capacity_edge_jg6htmccrw'::text,
                  DETAIL = CASE WHEN current_setting('is_superuser'::text) = 'on'::text OR CASE WHEN current_setting('role'::text) = 'none'::text THEN SESSION_USER::text ELSE current_setting('role'::text) END IN (CURRENT_USER::text, 'qti__author'::text) THEN 'w["Picture",'::text || to_jsonb("t"."c1"::text)::text || ']'::text ELSE 'w["Picture"]'::text END;
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

REVOKE EXECUTE ON FUNCTION "qti"."__law_picture_capacity_edge_kltcsqbzjl"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_picture_capacity_edge_6llcjojqyt"
  AFTER DELETE ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_picture_capacity_edge_kltcsqbzjl"();

CREATE CONSTRAINT TRIGGER "__law_picture_capacity_edge_sifzj4swpf"
  AFTER INSERT ON "qti"."picture"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_picture_capacity_edge_kltcsqbzjl"();

-- The full violation query of law __picture_capacity_edge_jg6htmccrw.
DO $$
BEGIN
  IF EXISTS (SELECT "r27"."c77" AS "id" FROM (SELECT "r13"."c39" FROM (SELECT DISTINCT "r12"."c37" FROM (SELECT DISTINCT "r11"."c35", "r11"."c36" FROM (SELECT DISTINCT "r4"."c3", "r10"."c34" FROM (SELECT DISTINCT "r3"."c2" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id" FROM "qti"."picture" AS "r1") AS "r2"("c1")) AS "r3"("c2")) AS "r4"("c3"), (SELECT DISTINCT "r9"."c31", "r9"."c32" FROM (SELECT "r8"."c25", count(*) FROM (SELECT DISTINCT "r7"."c13", "r7"."c14", "r7"."c15", "r7"."c16", "r7"."c17", "r7"."c18", "r7"."c19", "r7"."c20", "r7"."c21" FROM (SELECT DISTINCT "r6"."c4", "r6"."c5", "r6"."c6", "r6"."c7", "r6"."c8", "r6"."c9", "r6"."c10", "r6"."c11", "r6"."c12" FROM (SELECT DISTINCT "r5"."child", "r5"."child_ancestry", "r5"."child_kind", "r5"."parent", "r5"."parent_ancestry", "r5"."parent_kind", "r5"."position", "r5"."tree", "r5"."version" FROM "qti"."edge" AS "r5") AS "r6"("c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12") WHERE "r6"."c6" = 'source'::"qti"."node_kind") AS "r7"("c13", "c14", "c15", "c16", "c17", "c18", "c19", "c20", "c21")) AS "r8"("c22", "c23", "c24", "c25", "c26", "c27", "c28", "c29", "c30") GROUP BY "r8"."c25") AS "r9"("c31", "c32")) AS "r10"("c33", "c34") WHERE "r4"."c3" = "r10"."c33") AS "r11"("c35", "c36") WHERE "r11"."c36" < 1::bigint) AS "r12"("c37", "c38")) AS "r13"("c39") UNION SELECT "r26"."c76" FROM (SELECT DISTINCT "r25"."c75" FROM (SELECT DISTINCT "r24"."c74" FROM (SELECT DISTINCT "r17"."c42" FROM (SELECT DISTINCT "r16"."c41" FROM (SELECT DISTINCT "r15"."c40" FROM (SELECT DISTINCT "r14"."id" FROM "qti"."picture" AS "r14") AS "r15"("c40")) AS "r16"("c41")) AS "r17"("c42") WHERE NOT EXISTS (SELECT 1 FROM (SELECT DISTINCT "r22"."c70", "r22"."c71" FROM (SELECT "r21"."c64", count(*) FROM (SELECT DISTINCT "r20"."c52", "r20"."c53", "r20"."c54", "r20"."c55", "r20"."c56", "r20"."c57", "r20"."c58", "r20"."c59", "r20"."c60" FROM (SELECT DISTINCT "r19"."c43", "r19"."c44", "r19"."c45", "r19"."c46", "r19"."c47", "r19"."c48", "r19"."c49", "r19"."c50", "r19"."c51" FROM (SELECT DISTINCT "r18"."child", "r18"."child_ancestry", "r18"."child_kind", "r18"."parent", "r18"."parent_ancestry", "r18"."parent_kind", "r18"."position", "r18"."tree", "r18"."version" FROM "qti"."edge" AS "r18") AS "r19"("c43", "c44", "c45", "c46", "c47", "c48", "c49", "c50", "c51") WHERE "r19"."c45" = 'source'::"qti"."node_kind") AS "r20"("c52", "c53", "c54", "c55", "c56", "c57", "c58", "c59", "c60")) AS "r21"("c61", "c62", "c63", "c64", "c65", "c66", "c67", "c68", "c69") GROUP BY "r21"."c64") AS "r22"("c70", "c71")) AS "r23"("c72", "c73") WHERE "r23"."c72" = "r17"."c42")) AS "r24"("c74") WHERE 0::bigint < 1::bigint) AS "r25"("c75")) AS "r26"("c76")) AS "r27"("c77")) THEN
    RAISE EXCEPTION 'law __picture_capacity_edge_jg6htmccrw is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::text,
            CONSTRAINT = '__picture_capacity_edge_jg6htmccrw'::text;
  END IF;
END
$$;
