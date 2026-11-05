-- Validate law __match_interaction_capacity_edge_wdgbs4ckqr: its triggers and its violation query, under a lock excluding every writer to its tables.

LOCK TABLE "qti"."edge", "qti"."match_interaction" IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION "qti"."__law_match_interaction_capacity_edge_7dyekc3762"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."match_interaction" AS "r1" WHERE "r1"."id" = OLD."parent" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind") LOOP
      IF "g"."c1" < 2::bigint OR "g"."c1" > 2::bigint THEN
        RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchInteraction"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN OLD;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_interaction_capacity_edge_7dyekc3762"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_interaction_capacity_edge_xtddklsppq"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."match_interaction" AS "r1" WHERE "r1"."id" = NEW."parent" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind") LOOP
      IF "g"."c1" < 2::bigint OR "g"."c1" > 2::bigint THEN
        RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchInteraction"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_interaction_capacity_edge_xtddklsppq"() FROM PUBLIC;

CREATE OR REPLACE FUNCTION "qti"."__law_match_interaction_capacity_edge_a4ibtsbe4l"() RETURNS "pg_catalog"."trigger"
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = "pg_catalog", "pg_temp" SET plan_cache_mode = force_custom_plan
AS $$
DECLARE
  "t" "pg_catalog"."record";
  "g" "pg_catalog"."record";
BEGIN
  FOR "t" IN SELECT "r1"."id" AS "c1" FROM "qti"."match_interaction" AS "r1" WHERE "r1"."id" = NEW."id" LOOP
    FOR "g" IN SELECT "r2"."c1" AS "c1" FROM (SELECT "pg_catalog"."count"(*) AS "c1" FROM "qti"."edge" AS "r1" WHERE "r1"."parent" = "t"."c1" AND "r1"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind" GROUP BY "r1"."parent") AS "r2"("c1") UNION ALL SELECT 0::bigint AS "c1" WHERE NOT EXISTS (SELECT 1 FROM "qti"."edge" AS "r3" WHERE "r3"."parent" = "t"."c1" AND "r3"."child_kind" = 'qti-simple-match-set'::"qti"."node_kind") LOOP
      IF "g"."c1" < 2::bigint OR "g"."c1" > 2::bigint THEN
        RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr violated'
          USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
                CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::"pg_catalog"."text",
                DETAIL = CASE WHEN "pg_catalog"."current_setting"('is_superuser'::"pg_catalog"."text") = 'on'::"pg_catalog"."text" OR CASE WHEN "pg_catalog"."current_setting"('role'::"pg_catalog"."text") = 'none'::"pg_catalog"."text" THEN SESSION_USER::"pg_catalog"."text" ELSE "pg_catalog"."current_setting"('role'::"pg_catalog"."text") END IN (CURRENT_USER::"pg_catalog"."text", 'qti__author'::"pg_catalog"."text") THEN 'w["MatchInteraction",'::"pg_catalog"."text" || "pg_catalog"."to_jsonb"("t"."c1"::"pg_catalog"."text")::"pg_catalog"."text" || ']'::"pg_catalog"."text" ELSE 'w["MatchInteraction"]'::"pg_catalog"."text" END;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION "qti"."__law_match_interaction_capacity_edge_a4ibtsbe4l"() FROM PUBLIC;

CREATE CONSTRAINT TRIGGER "__law_match_interaction_capacity_edge_c4jbvk6nts"
  AFTER DELETE ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (OLD."child_kind" = 'qti-simple-match-set'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_match_interaction_capacity_edge_7dyekc3762"();

CREATE CONSTRAINT TRIGGER "__law_match_interaction_capacity_edge_hdg6uyurjn"
  AFTER INSERT ON "qti"."edge"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW WHEN (NEW."child_kind" = 'qti-simple-match-set'::"qti"."node_kind")
  EXECUTE FUNCTION "qti"."__law_match_interaction_capacity_edge_xtddklsppq"();

CREATE CONSTRAINT TRIGGER "__law_match_interaction_capacity_edge_5rs5u66tvn"
  AFTER INSERT ON "qti"."match_interaction"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "qti"."__law_match_interaction_capacity_edge_a4ibtsbe4l"();

-- The full violation query of law __match_interaction_capacity_edge_wdgbs4ckqr.
DO $$
BEGIN
  IF EXISTS (SELECT "r25"."c54" AS "id" FROM (WITH "r4"("c8") AS MATERIALIZED (SELECT DISTINCT "r3"."c7" FROM (SELECT DISTINCT "r2"."c1" FROM (SELECT DISTINCT "r1"."id", "r1"."max_associations_n", "r1"."min_associations_n", "r1"."response_identifier", "r1"."root_kind", "r1"."shuffle" FROM "qti"."match_interaction" AS "r1") AS "r2"("c1", "c2", "c3", "c4", "c5", "c6")) AS "r3"("c7")), "r12"("c39", "c40") AS MATERIALIZED (SELECT DISTINCT "r11"."c37", "r11"."c38" FROM (SELECT "r10"."c31", "pg_catalog"."count"(*) FROM (SELECT DISTINCT "r9"."c19", "r9"."c20", "r9"."c21", "r9"."c22", "r9"."c23", "r9"."c24", "r9"."c25", "r9"."c26", "r9"."c27" FROM (SELECT DISTINCT "r8"."c10", "r8"."c11", "r8"."c12", "r8"."c13", "r8"."c14", "r8"."c15", "r8"."c16", "r8"."c17", "r8"."c18" FROM (SELECT DISTINCT "r7"."child", "r7"."child_ancestry", "r7"."child_kind", "r7"."parent", "r7"."parent_ancestry", "r7"."parent_kind", "r7"."position", "r7"."tree", "r7"."version" FROM "qti"."edge" AS "r7") AS "r8"("c10", "c11", "c12", "c13", "c14", "c15", "c16", "c17", "c18") WHERE "r8"."c12" = 'qti-simple-match-set'::"qti"."node_kind") AS "r9"("c19", "c20", "c21", "c22", "c23", "c24", "c25", "c26", "c27")) AS "r10"("c28", "c29", "c30", "c31", "c32", "c33", "c34", "c35", "c36") GROUP BY "r10"."c31") AS "r11"("c37", "c38")) SELECT "r17"."c47" FROM (SELECT DISTINCT "r16"."c45" FROM (SELECT DISTINCT "r15"."c43", "r15"."c44" FROM (SELECT DISTINCT "r6"."c9", "r14"."c42" FROM (SELECT "r5"."c8" FROM "r4" AS "r5") AS "r6"("c9"), (SELECT "r13"."c39", "r13"."c40" FROM "r12" AS "r13") AS "r14"("c41", "c42") WHERE "r6"."c9" = "r14"."c41") AS "r15"("c43", "c44") WHERE "r15"."c44" < 2::bigint OR "r15"."c44" > 2::bigint) AS "r16"("c45", "c46")) AS "r17"("c47") UNION SELECT "r24"."c53" FROM (SELECT DISTINCT "r23"."c52" FROM (SELECT DISTINCT "r22"."c51" FROM (SELECT DISTINCT "r19"."c48" FROM (SELECT "r18"."c8" FROM "r4" AS "r18") AS "r19"("c48") WHERE NOT EXISTS (SELECT 1 FROM (SELECT "r20"."c39", "r20"."c40" FROM "r12" AS "r20") AS "r21"("c49", "c50") WHERE "r21"."c49" = "r19"."c48")) AS "r22"("c51") WHERE 0::bigint < 2::bigint OR 0::bigint > 2::bigint) AS "r23"("c52")) AS "r24"("c53")) AS "r25"("c54")) THEN
    RAISE EXCEPTION 'law __match_interaction_capacity_edge_wdgbs4ckqr is violated by existing rows'
      USING ERRCODE = 'integrity_constraint_violation'::"pg_catalog"."text",
            CONSTRAINT = '__match_interaction_capacity_edge_wdgbs4ckqr'::"pg_catalog"."text";
  END IF;
END
$$;
