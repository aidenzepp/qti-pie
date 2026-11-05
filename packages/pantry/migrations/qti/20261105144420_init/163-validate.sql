-- Validate law __picture_capacity_edge_4k5opdaymv: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."picture" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_picture_capacity_edge_dfmlqchuaa"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."picture" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
    PERFORM 1 FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'img'::"qti"."node_kind" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __picture_capacity_edge_4k5opdaymv violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__picture_capacity_edge_4k5opdaymv'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Picture",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Picture"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_picture_capacity_edge_dfmlqchuaa"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_picture_capacity_edge_lvxdouo4l2"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."picture" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    PERFORM 1 FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'img'::"qti"."node_kind" LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'law __picture_capacity_edge_4k5opdaymv violated'
        USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
              CONSTRAINT = '__picture_capacity_edge_4k5opdaymv'::"pg_catalog"."text",
              DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["Picture",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["Picture"]'::"pg_catalog"."text" END;
    END IF;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_picture_capacity_edge_lvxdouo4l2"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_picture_capacity_edge_lufcs722k4"
  AFTER DELETE ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (OLD."child_kind" = 'img'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_picture_capacity_edge_dfmlqchuaa"();

CREATE CONSTRAINT TRIGGER "__law_picture_capacity_edge_4v6xjylcwt"
  AFTER INSERT ON "qti"."picture"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_picture_capacity_edge_lvxdouo4l2"();

-- The full violation query of law __picture_capacity_edge_4k5opdaymv.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c49" AS "id" FROM (WITH "r4"("c3") AS MATERIALIZED (SELECT DISTINCT "r3"."c2" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id" FROM "qti"."picture" AS "r1") AS "r2"("c1")) AS "r3"("c2")), "r12"("c34", "c35") AS MATERIALIZED (SELECT DISTINCT "r11"."c32", "r11"."c33" FROM (SELECT "r10"."c26", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c14", "r9"."c15", "r9"."c16", "r9"."c17", "r9"."c18", "r9"."c19", "r9"."c20", "r9"."c21", "r9"."c22" FROM (SELECT DISTINCT "r8"."c5", "r8"."c6", "r8"."c7", "r8"."c8", "r8"."c9", "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13" FROM (SELECT DISTINCT "r7"."child", "r7"."child_ancestry", "r7"."child_kind", "r7"."parent", "r7"."parent_ancestry", "r7"."parent_kind", "r7"."position", "r7"."tree", "r7"."version" FROM "qti"."edge" AS "r7") AS "r8"("c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12", "c13") WHERE "r8"."c7" = 'img'::"qti"."node_kind") AS "r9"("c14", "c15", "c16", "c17", "c18", "c19", "c20", "c21", "c22")) AS "r10"("c23", "c24", "c25", "c26", "c27", "c28", "c29", "c30", "c31") GROUP BY "r10"."c26") AS "r11"("c32", "c33")) SELECT "r17"."c42" FROM (SELECT DISTINCT "r16"."c40" FROM (SELECT DISTINCT "r15"."c38", "r15"."c39" FROM (SELECT DISTINCT "r6"."c4", "r14"."c37" FROM (SELECT "r5"."c3" FROM "r4" AS "r5") AS "r6"("c4"), (SELECT "r13"."c34", "r13"."c35" FROM "r12" AS "r13") AS "r14"("c36", "c37") WHERE "r6"."c4" = "r14"."c36") AS "r15"("c38", "c39") WHERE "r15"."c39" < 1::bigint OR "r15"."c39" > 1::bigint) AS "r16"("c40", "c41")) AS "r17"("c42") UNION SELECT "r24"."c48" FROM (SELECT DISTINCT "r23"."c47" FROM (SELECT DISTINCT "r22"."c46" FROM (SELECT DISTINCT "r19"."c43" FROM (SELECT "r18"."c3" FROM "r4" AS "r18") AS "r19"("c43") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c34", "r20"."c35" FROM "r12" AS "r20") AS "r21"("c44", "c45") WHERE "r21"."c44" = "r19"."c43")) AS "r22"("c46") WHERE 0::bigint < 1::bigint OR 0::bigint > 1::bigint) AS "r23"("c47")) AS "r24"("c48")) AS "r25"("c49")) THEN
    RAISE EXCEPTION 'law __picture_capacity_edge_4k5opdaymv is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__picture_capacity_edge_4k5opdaymv'::"pg_catalog"."text";
  END IF;
END
$$;
